import jwt from "jsonwebtoken";
import { stripe } from "../../config/stripe.js";
import { query, withTransaction } from "../../config/db.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";
import { emitToMatch } from "../../config/socket.js";
import { logger } from "../../utils/logger.js";

const getPendingTicketsForPayment = async (userId, ticketIds) => {
  const result = await query(
    `SELECT t.id, t.user_id, t.match_id, t.seat_id, t.status, st.price
     FROM tickets t
     JOIN seats s ON s.id = t.seat_id
     JOIN stands st ON st.id = s.stand_id
     WHERE t.user_id = $1
       AND t.id = ANY($2::bigint[])
       AND t.status = $3`,
    [userId, ticketIds, TICKET_STATUS.PENDING]
  );
  return result.rows;
};

/**
 * Xử lý payment_intent.succeeded — idempotent.
 * Dùng FOR UPDATE để tránh race condition nếu Stripe gửi webhook 2 lần.
 */
const handlePaymentSucceeded = async (intent) => {
  const userId = Number(intent.metadata.userId);
  const ticketIds = intent.metadata.ticketIds
    .split(",")
    .map((id) => Number(id.trim()))
    .filter(Boolean);

  // Idempotency check: nếu payment đã succeeded rồi thì bỏ qua
  const paymentCheck = await query(
    "SELECT status FROM payments WHERE stripe_payment_intent_id = $1",
    [intent.id]
  );
  if (paymentCheck.rows[0]?.status === "succeeded") {
    logger.warn(`[Webhook] Duplicate payment_intent.succeeded for ${intent.id} — skipped.`);
    return;
  }

  await withTransaction(async (tx) => {
    const run = (text, params) => tx.query(text, params);

    // Lock payment record trước (idempotency via DB lock)
    await run(
      "SELECT id FROM payments WHERE stripe_payment_intent_id = $1 FOR UPDATE",
      [intent.id]
    );

    for (const ticketId of ticketIds) {
      const ticketResult = await run(
        "SELECT id, match_id, seat_id, user_id, status FROM tickets WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [ticketId, userId]
      );
      if (ticketResult.rowCount === 0) continue;

      const ticket = ticketResult.rows[0];
      // Skip nếu vé đã được xử lý (idempotency)
      if (ticket.status !== TICKET_STATUS.PENDING) continue;

      const qrToken = jwt.sign(
        {
          ticketId: ticket.id,
          matchId: ticket.match_id,
          seatId: ticket.seat_id,
          userId: ticket.user_id
        },
        process.env.QR_JWT_SECRET || process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      await run("UPDATE tickets SET status = $1, qr_token = $2 WHERE id = $3", [
        TICKET_STATUS.PAID,
        qrToken,
        ticket.id
      ]);

      // Emit seat update realtime
      emitToMatch(ticket.match_id, "seat:paid", {
        matchId: ticket.match_id,
        seatId: ticket.seat_id,
        ticketId: ticket.id,
        status: "paid"
      });
    }

    // Cập nhật payment record
    await run(
      `UPDATE payments
       SET status = 'succeeded', paid_at = NOW()
       WHERE stripe_payment_intent_id = $1`,
      [intent.id]
    );
  });

  logger.info(`[Webhook] payment_intent.succeeded processed: ${intent.id}, tickets: [${ticketIds.join(",")}]`);
};

export const paymentsService = {
  async createIntent({ userId, ticketIds, currency = "vnd" }) {
    const tickets = await getPendingTicketsForPayment(userId, ticketIds);
    if (tickets.length === 0 || tickets.length !== ticketIds.length) {
      throw new Error("Danh sách vé thanh toán không hợp lệ.");
    }

    const amount = tickets.reduce((sum, ticket) => sum + Number(ticket.price), 0);
    const amountInMinorUnit = Math.max(1, Math.round(amount));

    const intent = await stripe.paymentIntents.create({
      amount: amountInMinorUnit,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String(userId),
        ticketIds: ticketIds.join(",")
      }
    });

    await query(
      `INSERT INTO payments (ticket_id, user_id, stripe_payment_intent_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (stripe_payment_intent_id) DO NOTHING`,
      [tickets[0].id, userId, intent.id, amountInMinorUnit, currency]
    );

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  },

  async handleWebhook(rawBody, signature) {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await query(
          "UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = $1",
          [event.data.object.id]
        );
        logger.warn(`[Webhook] Payment failed: ${event.data.object.id}`);
        break;

      default:
        logger.debug(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
};
