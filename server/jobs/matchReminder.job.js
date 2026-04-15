import cron from "node-cron";
import { query } from "../src/config/db.js";
import { getMailer } from "../src/config/nodemailer.js";

const sendReminderMail = async ({ to, fullName, matchTitle, matchDate }) => {
  const transporter = getMailer();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `[GoTicket] Nhac tran dau sap dien ra`,
    html: `
      <h3>Xin chao ${fullName || "ban"},</h3>
      <p>Tran dau <strong>${matchTitle}</strong> se bat dau luc ${new Date(matchDate).toLocaleString("vi-VN")}.</p>
      <p>Vui long den san som de check-in.</p>
    `
  });
};

const fetchReminderCandidates = async () => {
  const result = await query(
    `SELECT
       t.id AS ticket_id,
       u.email,
       u.full_name,
       m.home_team,
       m.away_team,
       m.match_date
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     JOIN matches m ON m.id = t.match_id
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
      for (const row of candidates) {
        await sendReminderMail({
          to: row.email,
          fullName: row.full_name,
          matchTitle: `${row.home_team} vs ${row.away_team}`,
          matchDate: row.match_date
        });

        await query("UPDATE tickets SET reminder_sent = true WHERE id = $1", [row.ticket_id]);
      }
    } catch (error) {
      console.error("matchReminder.job failed:", error.message);
    }
  });
};
