import cron from "node-cron";
import { query } from "../src/config/db.js";
import { getMailer } from "../src/config/nodemailer.js";
import { logger } from "../src/utils/logger.js";

/**
 * Gửi email nhắc nhở trận đấu.
 * Subject dùng ASCII để tránh encoding issue với một số SMTP server.
 */
const sendReminderMail = async ({ to, fullName, homeTeam, awayTeam, matchDate, stadiumName }) => {
  const transporter = getMailer();
  if (!transporter) return false;

  const matchTitle = `${homeTeam} vs ${awayTeam}`;
  const matchTime = new Date(matchDate).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  await transporter.sendMail({
    from: `GoTicket <${process.env.GMAIL_USER}>`,
    to,
    subject: `[GoTicket] Tran dau sap bat dau trong 1 gio: ${homeTeam} vs ${awayTeam}`,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#6d28d9,#2563eb);padding:32px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🏟️ GoTicket</h1>
        <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">Nhắc nhở trận đấu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;color:#9ca3af;font-size:15px;">Xin chào <strong style="color:#e5e7eb;">${fullName || "bạn"}</strong>,</p>
        <div style="background:#16213e;border:1px solid #2d2d5e;border-radius:12px;padding:24px;margin:16px 0;text-align:center;">
          <p style="margin:0 0 8px;color:#7c3aed;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Trận đấu sắp bắt đầu</p>
          <h2 style="margin:0 0 16px;color:#fff;font-size:22px;font-weight:700;">${matchTitle}</h2>
          <div style="display:inline-flex;align-items:center;gap:8px;background:#1e1b4b;padding:10px 20px;border-radius:8px;">
            <span style="color:#a78bfa;font-size:14px;">🕐 ${matchTime}</span>
          </div>
          ${stadiumName ? `<p style="margin:12px 0 0;color:#6b7280;font-size:13px;">📍 ${stadiumName}</p>` : ""}
        </div>
        <div style="background:#16213e;border:1px solid #fbbf24;border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;color:#fbbf24;font-weight:600;font-size:15px;">⚡ Còn khoảng 1 giờ nữa!</p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Đừng quên mang vé điện tử (QR code) để check-in vào sân nhé.</p>
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;text-align:center;">
          Đây là email tự động từ GoTicket - Nền tảng đặt vé thể thao trực tuyến.<br>
          Vui lòng không trả lời email này.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  });
  return true;
};

const fetchReminderCandidates = async () => {
  const result = await query(
    `SELECT
       t.id AS ticket_id,
       u.email,
       u.full_name,
       m.home_team, m.away_team, m.match_date,
       st.name AS stadium_name
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     JOIN matches m ON m.id = t.match_id
     LEFT JOIN stadiums st ON st.id = m.stadium_id
     WHERE t.reminder_sent = false
       AND t.status IN ('paid', 'checked_in')
       AND m.match_date BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'`
  );
  return result.rows;
};

export const startMatchReminderJob = () => {
  return cron.schedule("* * * * *", async () => {
    try {
      const candidates = await fetchReminderCandidates();
      if (candidates.length === 0) return;

      logger.info(`[matchReminder] Sending ${candidates.length} reminder email(s).`);

      // Batch: không gửi quá 10 email cùng lúc
      const BATCH_SIZE = 10;
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (row) => {
            const sent = await sendReminderMail({
              to: row.email,
              fullName: row.full_name,
              homeTeam: row.home_team,
              awayTeam: row.away_team,
              matchDate: row.match_date,
              stadiumName: row.stadium_name
            });
            if (sent) {
              await query("UPDATE tickets SET reminder_sent = true WHERE id = $1", [row.ticket_id]);
            }
          })
        );
      }
    } catch (error) {
      logger.error(`[matchReminder] Job failed: ${error.message}`);
    }
  });
};
