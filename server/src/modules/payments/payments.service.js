import jwt from "jsonwebtoken";
import { stripe } from "../../config/stripe.js";
import { query, withTransaction } from "../../config/db.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";

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

export const paymentsService = {
  async createIntent({ userId, ticketIds, currency = "vnd" }) {
    const tickets = await getPendingTicketsForPayment(userId, ticketIds);
    if (tickets.length === 0 || tickets.length !== ticketIds.length) {
      throw new Error("Danh sách vé thanh toán không hợp lệ.");
    }

    const amount = tickets.reduce((sum, ticket) => sum + Number(ticket.price), 0);
    const amountInMinorUnit = Math.max(0, Math.round(amount));

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

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const userId = Number(intent.metadata.userId);
      const ticketIds = intent.metadata.ticketIds
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Boolean);

      await withTransaction(async (tx) => {
        const run = (text, params) => tx.query(text, params);
        for (const ticketId of ticketIds) {
          const ticketResult = await run(
            "SELECT id, match_id, seat_id, user_id FROM tickets WHERE id = $1 AND user_id = $2 FOR UPDATE",
            [ticketId, userId]
          );
          if (ticketResult.rowCount === 0) continue;
          const ticket = ticketResult.rows[0];
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
        }

        await run(
          `UPDATE payments
           SET status = 'succeeded', paid_at = NOW()
           WHERE stripe_payment_intent_id = $1`,
          [intent.id]
        );
      });
    }

    return { received: true };
  }
};
