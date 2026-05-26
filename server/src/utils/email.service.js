import QRCode from "qrcode";
import { getMailer } from "../config/nodemailer.js";
import { query } from "../config/db.js";
import { logger } from "./logger.js";

/**
 * Query đầy đủ thông tin vé, trận đấu, user, stadium cho email.
 */
const getTicketEmailData = async (userId, ticketIds) => {
  // Lấy thông tin user
  const userResult = await query(
    "SELECT id, email, full_name FROM users WHERE id = $1",
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) throw new Error(`User ${userId} not found`);

  // Lấy thông tin vé + trận + sân vận động + khán đài (gom theo ticket_code & stand)
  const ticketResult = await query(
    `SELECT
       t.ticket_code,
       t.qr_token,
       m.id          AS match_id,
       m.home_team,
       m.away_team,
       m.match_date,
       std.name      AS stadium_name,
       std.address   AS stadium_address,
       std.city      AS stadium_city,
       st.name       AS stand_name,
       st.price,
       COUNT(t.id)   AS quantity
     FROM tickets t
     JOIN seats  s   ON s.id   = t.seat_id
     JOIN stands st  ON st.id  = s.stand_id
     JOIN matches m  ON m.id   = t.match_id
     JOIN stadiums std ON std.id = m.stadium_id
     WHERE t.id = ANY($1::bigint[]) AND t.user_id = $2
     GROUP BY t.ticket_code, t.qr_token, m.id, m.home_team, m.away_team,
              m.match_date, std.name, std.address, std.city, st.name, st.price
     ORDER BY st.name`,
    [ticketIds, userId]
  );

  return { user, rows: ticketResult.rows };
};

/**
 * Query đầy đủ thông tin vé, trận đấu, user, stadium cho email dựa trên ticket_code.
 */
const getTicketEmailDataByCode = async (userId, ticketCode) => {
  const userResult = await query(
    "SELECT id, email, full_name FROM users WHERE id = $1",
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) throw new Error(`User ${userId} not found`);

  const ticketResult = await query(
    `SELECT
       t.ticket_code,
       t.qr_token,
       m.id          AS match_id,
       m.home_team,
       m.away_team,
       m.match_date,
       std.name      AS stadium_name,
       std.address   AS stadium_address,
       std.city      AS stadium_city,
       st.name       AS stand_name,
       st.price,
       COUNT(t.id)   AS quantity
     FROM tickets t
     JOIN seats  s   ON s.id   = t.seat_id
     JOIN stands st  ON st.id  = s.stand_id
     JOIN matches m  ON m.id   = t.match_id
     JOIN stadiums std ON std.id = m.stadium_id
     WHERE t.ticket_code = $1 AND t.user_id = $2
     GROUP BY t.ticket_code, t.qr_token, m.id, m.home_team, m.away_team,
              m.match_date, std.name, std.address, std.city, st.name, st.price
     ORDER BY st.name`,
    [ticketCode, userId]
  );

  return { user, rows: ticketResult.rows };
};

/**
 * Format ngày giờ theo múi giờ Việt Nam (UTC+7).
 */
const formatMatchDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Format tiền VND.
 */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// Xóa hàm generateQRBuffer vì giờ dùng public API

// Xóa public API vì Gmail không load được ảnh localhost
/**
 * Build HTML template cho email xác nhận vé.
 * @param {string} qrUrl - URL hình ảnh QR
 * @param {string} recipientEmail - Nếu có, thay đổi lời chào là được tặng vé
 */
const buildEmailHTML = ({ user, rows, qrUrl, clientUrl, recipientEmail }) => {
  const first = rows[0];
  const matchDate = formatMatchDate(first.match_date);
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity), 0);
  const totalPrice = rows.reduce((s, r) => s + Number(r.price) * Number(r.quantity), 0);
  const myTicketsUrl = `${clientUrl}/audience/my-tickets`;

  // Rows cho bảng tóm tắt vé
  const standRows = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">${r.stand_name}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;text-align:center;">${r.quantity}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;text-align:right;">${formatCurrency(r.price)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${formatCurrency(r.price * r.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác nhận đặt vé - GoTicket</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#0ea5e9 100%);padding:40px 32px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50px;padding:8px 24px;margin-bottom:20px;">
              <span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:2px;">⚽ GoTicket</span>
            </div>
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              ${recipientEmail ? "Bạn được tặng 1 vé! 🎁" : "Đặt vé thành công! 🎉"}
            </h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">
              ${recipientEmail 
                ? `Bạn vừa được <strong>${user.full_name || user.email}</strong> tặng một vé xem thể thao trên GoTicket.` 
                : `Cảm ơn <strong>${user.full_name || user.email}</strong> đã tin tưởng GoTicket`}
            </p>
          </td>
        </tr>

        <!-- MATCH INFO CARD -->
        <tr>
          <td style="padding:32px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1.5px solid #bfdbfe;border-radius:16px;overflow:hidden;">
              <tr>
                <!-- Home team -->
                <td width="40%" style="padding:24px 16px;text-align:center;">
                  <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Chủ nhà</div>
                  <div style="font-size:18px;font-weight:800;color:#1e40af;line-height:1.3;">${first.home_team}</div>
                </td>
                <!-- VS -->
                <td width="20%" style="text-align:center;padding:24px 4px;">
                  <div style="background:#2563eb;color:#ffffff;font-size:14px;font-weight:900;border-radius:50px;padding:6px 12px;display:inline-block;letter-spacing:1px;">VS</div>
                </td>
                <!-- Away team -->
                <td width="40%" style="padding:24px 16px;text-align:center;">
                  <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Đội khách</div>
                  <div style="font-size:18px;font-weight:800;color:#1e40af;line-height:1.3;">${first.away_team}</div>
                </td>
              </tr>
              <!-- Divider -->
              <tr>
                <td colspan="3" style="padding:0 16px;">
                  <div style="border-top:1px dashed #bfdbfe;"></div>
                </td>
              </tr>
              <!-- Match details -->
              <tr>
                <td colspan="3" style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;width:50%;">
                        <span style="font-size:13px;color:#6b7280;">🕐 Thời gian</span><br/>
                        <span style="font-size:14px;font-weight:700;color:#1e293b;">${matchDate}</span>
                      </td>
                      <td style="padding:6px 0;width:50%;">
                        <span style="font-size:13px;color:#6b7280;">🏟️ Sân vận động</span><br/>
                        <span style="font-size:14px;font-weight:700;color:#1e293b;">${first.stadium_name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:6px 0;">
                        <span style="font-size:13px;color:#6b7280;">📍 Địa chỉ</span><br/>
                        <span style="font-size:14px;font-weight:700;color:#1e293b;">${first.stadium_address}, ${first.stadium_city}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TICKET SUMMARY TABLE -->
        <tr>
          <td style="padding:24px 32px 0;">
            <h3 style="margin:0 0 12px;color:#0f172a;font-size:16px;font-weight:700;">🎟️ Chi tiết vé</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Khán đài</th>
                  <th style="padding:12px 16px;text-align:center;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">SL</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Đơn giá</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${standRows}</tbody>
              <tfoot>
                <tr style="background:#eff6ff;">
                  <td colspan="3" style="padding:14px 16px;font-size:15px;font-weight:800;color:#1e40af;">Tổng cộng (${totalQty} vé)</td>
                  <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:800;color:#1e40af;">${formatCurrency(totalPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- TICKET CODE -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:12px;padding:14px 20px;text-align:center;">
              <span style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mã vé của bạn</span><br/>
              <span style="font-size:26px;font-weight:900;color:#0f172a;letter-spacing:6px;font-family:'Courier New',monospace;">${first.ticket_code}</span>
            </div>
          </td>
        </tr>

        <!-- QR CODE -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">📲 Mã QR Check-in</h3>
            <div style="display:inline-block;background:#ffffff;border:2px solid #e2e8f0;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <img src="${qrUrl}" alt="QR Code vé" width="220" height="220" style="display:block;border-radius:8px;" />
            </div>
            <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
              Xuất trình mã này tại cửa vào sân để check-in
            </p>
          </td>
        </tr>

        <!-- CTA BUTTON -->
        ${!recipientEmail ? `
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <a href="${myTicketsUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(37,99,235,0.4);">
              🎟️ Xem Vé Của Tôi
            </a>
            <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">
              Hoặc truy cập: <a href="${myTicketsUrl}" style="color:#2563eb;">${myTicketsUrl}</a>
            </p>
          </td>
        </tr>
        ` : ""}

        <!-- NOTICE -->
        <tr>
          <td style="padding:24px 32px 0;">
            <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                <strong>⚠️ Lưu ý:</strong> Vui lòng đến sân trước giờ thi đấu <strong>30 phút</strong> để check-in. 
                Mã QR chỉ có hiệu lực cho đúng trận đấu này và không thể chuyển nhượng.
              </p>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:32px;text-align:center;border-top:1px solid #f1f5f9;margin-top:32px;">
            <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#1e40af;">⚽ GoTicket</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              Email này được gửi tự động, vui lòng không reply trực tiếp.<br/>
              Nếu bạn không thực hiện giao dịch này, hãy liên hệ hỗ trợ ngay.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
};

/**
 * Gửi email xác nhận đặt vé thành công.
 * @param {number} userId
 * @param {number[]} ticketIds
 * @param {string} qrToken  — JWT token đã được lưu vào DB
 */
export const sendTicketConfirmationEmail = async (userId, ticketIds, qrToken) => {
  const mailer = getMailer();
  if (!mailer) {
    logger.warn("[Email] Mailer not configured — skipping ticket confirmation email.");
    return;
  }

  const { user, rows } = await getTicketEmailData(userId, ticketIds);
  if (!rows.length) {
    logger.warn(`[Email] No ticket data found for userId=${userId}, ticketIds=${ticketIds}`);
    return;
  }

  const first = rows[0];
  const qrData = JSON.stringify({
    token: qrToken,
    ticketCode: first.ticket_code,
    match: `${first.home_team} vs ${first.away_team}`,
    date: formatMatchDate(first.match_date),
    stadium: first.stadium_name
  });

  // Sử dụng Public QR API (QuickChart) để đảm bảo mọi Mail Client (bao gồm Gmail) đều có thể tải được ảnh, không bị block base64 hay lỗi CID
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=300&margin=2`;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const html = buildEmailHTML({ user, rows, qrUrl, clientUrl });
  const subject = `✅ Đặt vé thành công — ${first.home_team} vs ${first.away_team} | GoTicket`;

  await mailer.sendMail({
    from: `"GoTicket" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject,
    html
  });

  logger.info(`[Email] Ticket confirmation sent to ${user.email} (userId=${userId}, tickets=[${ticketIds.join(",")}])`);
};

/**
 * Gửi email tặng vé cho bạn bè.
 */
export const sendGiftTicketEmail = async (userId, ticketCode, recipientEmail) => {
  const mailer = getMailer();
  if (!mailer) {
    logger.warn("[Email] Mailer not configured — skipping gift ticket email.");
    return;
  }

  const { user, rows } = await getTicketEmailDataByCode(userId, ticketCode);
  if (!rows.length) {
    throw new Error(`[Email] No ticket data found for userId=${userId}, ticketCode=${ticketCode}`);
  }

  const qrToken = rows[0].qr_token;
  const first = rows[0];
  const qrData = JSON.stringify({
    token: qrToken,
    ticketCode: first.ticket_code,
    match: `${first.home_team} vs ${first.away_team}`,
    date: formatMatchDate(first.match_date),
    stadium: first.stadium_name
  });
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=300&margin=2`;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const html = buildEmailHTML({ user, rows, qrUrl, clientUrl, recipientEmail });
  const subject = `🎁 ${user.full_name || user.email} đã tặng bạn một vé: ${first.home_team} vs ${first.away_team} | GoTicket`;

  await mailer.sendMail({
    from: `"GoTicket" <${process.env.GMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html
  });

  logger.info(`[Email] Gift ticket sent to ${recipientEmail} from user ${user.email} (ticketCode=${ticketCode})`);
};
