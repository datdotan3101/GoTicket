import { getGroq } from "../../config/groq.js";
import { query } from "../../config/db.js";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_TOKENS = 1024;

/**
 * System prompt — cho Groq biết context của GoTicket.
 * Viết ngắn gọn để tiết kiệm token (Groq free có giới hạn 30 req/min).
 */
const SYSTEM_PROMPT = `Bạn là trợ lý AI của GoTicket — nền tảng đặt vé thể thao trực tuyến tại Việt Nam.
Nhiệm vụ của bạn:
1. Trả lời câu hỏi về trận đấu, vé, sân vận động, giải đấu.
2. Gợi ý trận đấu phù hợp với sở thích người dùng.
3. Hướng dẫn đặt vé, chọn ghế, thanh toán.
4. Khi user muốn đặt vé, trả về URL dạng: /checkout?match=ID&stand=A&qty=2

Quy tắc:
- Trả lời tiếng Việt, thân thiện, ngắn gọn.
- Khi liệt kê lịch thi đấu, hãy dùng danh sách đánh số dạng: "1. Trận [Đội A] với [Đội B], ngày [thời gian], tại sân [Tên sân]."
- Tuyệt đối KHÔNG hiển thị mã ID của trận đấu ra ngoài cho người dùng thấy. Mã ID chỉ dùng để tạo URL đặt vé.
- Không tự chế thông tin về trận đấu nếu không có dữ liệu.
- Nếu không biết, hãy nói thẳng và gợi ý user xem trang chính.`;

/**
 * Lấy thông tin trận đang mở bán để đưa vào context AI.
 */
const getActiveMatchesContext = async () => {
  const result = await query(
    `SELECT m.id, m.home_team, m.away_team, m.match_date,
            m.ticket_sale_open_at, st.name AS stadium_name,
            l.name AS league_name
     FROM matches m
     LEFT JOIN stadiums st ON st.id = m.stadium_id
     LEFT JOIN leagues l ON l.id = m.league_id
     WHERE m.status IN ('published', 'upcoming')
       AND m.match_date > NOW()
     ORDER BY m.match_date ASC
     LIMIT 10`
  );
  if (result.rows.length === 0) return { aiContext: "", userText: "" };

  const aiLines = result.rows.map(
    (m) =>
      `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("vi-VN")} | Sân: ${m.stadium_name || "N/A"} | Giải: ${m.league_name || "N/A"}`
  );
  
  const userLines = result.rows.map(
    (m, idx) =>
      `${idx + 1}. Trận ${m.home_team} với ${m.away_team}, lúc ${new Date(m.match_date).toLocaleString("vi-VN")}, tại sân ${m.stadium_name || "N/A"}.`
  );

  return {
    aiContext: `\nCác trận đấu sắp diễn ra:\n${aiLines.join("\n")}`,
    userText: `${userLines.join("\n")}`
  };
};

export const aiService = {
  /**
   * Chat với Groq Llama — truyền lịch sử messages để duy trì context.
   * @param {string} userId
   * @param {Array<{role: string, content: string}>} messages - Lịch sử chat từ client
   */
  async chat(userId, messages) {
    const groq = getGroq();

    // Lấy context trận đấu hiện tại (không fail nếu DB lỗi)
    let matchContext = { aiContext: "", userText: "" };
    try {
      matchContext = await getActiveMatchesContext();
    } catch {
      // Bỏ qua nếu DB chưa sẵn sàng
    }

    if (!groq) {
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let reply = "Xin chào! Tôi có thể giúp bạn tìm lịch thi đấu hoặc đặt vé. Vui lòng hỏi tôi về 'lịch thi đấu', 'trận đấu sắp tới' hoặc 'đặt vé' nhé.";
      
      if (lastMsg.includes("đặt vé") || lastMsg.includes("mua vé")) {
         const activeResult = await query("SELECT id FROM matches WHERE status IN ('published', 'upcoming') AND match_date > NOW() ORDER BY match_date ASC LIMIT 1");
         if (activeResult.rows.length > 0) {
            reply = `Tuyệt vời, bạn có thể bắt đầu đặt vé ngay! Dẫn đến /checkout?match=${activeResult.rows[0].id}`;
         } else {
            reply = "Hiện tại chưa có trận đấu nào đang mở bán. Bạn vui lòng quay lại sau nhé!";
         }
      } else if (lastMsg.includes("lịch") || lastMsg.includes("trận đấu") || lastMsg.includes("sắp tới")) {
         reply = matchContext.userText ? `Dưới đây là lịch thi đấu sắp tới:\n\n${matchContext.userText}\n\nBạn muốn đặt vé trận nào không? (Ví dụ: "đặt vé")` : "Hiện tại chưa có trận đấu nào sắp tới.";
      } else if (lastMsg.includes("chào") || lastMsg.includes("hi")) {
         reply = "Chào bạn! Mình là trợ lý GoTicket (Offline mode). Bạn cần tìm trận đấu hay đặt vé hôm nay?";
      }

      return {
        message: reply,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + matchContext.aiContext
    };

    // Giới hạn lịch sử tránh vượt context window
    const recentMessages = messages.slice(-10);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [systemMessage, ...recentMessages],
      max_tokens: MAX_TOKENS,
      temperature: 0.7
    });

    return {
      message: completion.choices[0]?.message?.content ?? "",
      usage: completion.usage
    };
  },

  /**
   * Gợi ý trận đấu dựa trên sở thích của user (primary_sport_id).
   * Cache 5 phút phía client (trả về Cache-Control header từ controller).
   * @param {string} userId
   */
  async getRecommendations(userId) {
    // Lấy sở thích sport của user
    const userResult = await query(
      "SELECT primary_sport_id, secondary_sport_id FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    const sportIds = [user?.primary_sport_id, user?.secondary_sport_id]
      .filter(Boolean)
      .map(Number);

    let whereExtra = "";
    const values = [];

    if (sportIds.length > 0) {
      // Ưu tiên matches thuộc sport yêu thích qua league.sport_id
      values.push(sportIds);
      whereExtra = `AND l.sport_id = ANY($1::bigint[])`;
    }

    const result = await query(
      `SELECT m.id, m.home_team, m.away_team, m.match_date,
              m.thumbnail_url, m.ticket_sale_open_at, m.status,
              st.name AS stadium_name, st.city AS stadium_city,
              l.name AS league_name,
              COALESCE(sold.sold_count, 0) AS sold_count,
              COALESCE(total.total_seats, 0) AS total_seats
       FROM matches m
       LEFT JOIN stadiums st ON st.id = m.stadium_id
       LEFT JOIN leagues l ON l.id = m.league_id
       LEFT JOIN (
         SELECT match_id, COUNT(*) AS sold_count
         FROM tickets WHERE status IN ('paid', 'checked_in')
         GROUP BY match_id
       ) sold ON sold.match_id = m.id
       LEFT JOIN (
         SELECT match_id, COUNT(*) AS total_seats
         FROM seats GROUP BY match_id
       ) total ON total.match_id = m.id
       WHERE m.status IN ('published', 'upcoming')
         AND m.match_date > NOW()
         ${whereExtra}
       ORDER BY ${sportIds.length > 0 ? "l.sport_id = ANY($1::bigint[]) DESC," : ""} m.match_date ASC
       LIMIT 6`,
      values
    );

    return result.rows;
  }
};
