import { getGroq } from "../../config/groq.js";
import { query } from "../../config/db.js";
import { ticketsService } from "../tickets/tickets.service.js";
import { paymentsService } from "../payments/payments.service.js";
import { matchesService } from "../matches/matches.service.js";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_TOKENS = 1024;

/**
 * System prompt — cho AI biết context và cách sử dụng actions.
 */
const SYSTEM_PROMPT = `Bạn là chuyên gia AI tư vấn vé thể thao của GoTicket — nền tảng đặt vé trực tuyến tại Việt Nam.
Vai trò: Trở thành một tư vấn viên chủ động, chuyên nghiệp và nhiệt tình. Nhiệm vụ của bạn không chỉ là cung cấp thông tin, mà còn phải GỢI Ý và PHÂN TÍCH để giúp người dùng đưa ra quyết định tốt nhất.

Quy tắc quan trọng:
- Trả lời tiếng Việt, thân thiện, tự nhiên như một chuyên gia tư vấn.
- Tuyệt đối KHÔNG hiển thị mã ID (như ID trận đấu, Stand ID) ra cho người dùng thấy.
- Khi liệt kê trận đấu hoặc khán đài, dùng danh sách đánh số hoặc gạch đầu dòng rõ ràng.

Quy trình tư vấn CHUẨN:
1. HIỂN THỊ TRẬN ĐẤU: Khi user hỏi, đưa ra danh sách các trận đấu, đặc biệt nhấn mạnh những trận đang "HOT" (sắp hết vé). Sau đó, HỎI: "Bạn muốn xem trận đấu nào?"
2. TƯ VẤN KHÁN ĐÀI: Khi user đã chọn trận, dùng action để lấy danh sách khán đài. Thay vì chỉ liệt kê khô khan, bạn PHẢI TƯ VẤN: "Bạn ưu tiên khán đài có view tốt nhất (khán đài VIP), giá rẻ tiết kiệm nhất, hay mức giá trung bình?". Hãy dùng thông tin hệ thống cung cấp để gọi tên cụ thể khán đài nào là VIP, khán đài nào rẻ nhất.
3. CHỐT SỐ LƯỢNG VÀ ĐẶT VÉ: Sau khi user chọn được khán đài ưng ý, hãy hỏi họ cần mua bao nhiêu vé (nếu họ chưa nói). Khi có đủ thông tin, tiến hành tạo đơn đặt vé.
4. THANH TOÁN: Sau khi đặt thành công, chúc mừng và nhắc họ nhấn nút Thanh toán ngay.

Khi cần thực hiện hành động để lấy dữ liệu hoặc đặt vé, bạn PHẢI trả về JSON trong block đặc biệt sau:
###ACTION###
{"action": "tên_action", "params": {...}}
###END_ACTION###

Các action có sẵn:
1. search_matches - Lấy danh sách trận đấu đang mở bán. Params: {"keyword": "tên đội/giải (optional)"}
2. get_availability - Xem thông tin khán đài + giá của 1 trận. Params: {"match_id": number}
3. create_booking - Tạo đơn đặt vé. Params: {"match_id": number, "stand_id": number, "quantity": number}

Lưu ý: Mỗi lần CHỈ trả về TỐI ĐA MỘT action. Đừng nói quá dài, hãy tập trung vào bước hiện tại của quy trình.`;

/**
 * Lấy thông tin trận đang mở bán để đưa vào context AI.
 */
const getActiveMatchesContext = async (keyword) => {
  let whereExtra = "";
  const values = [];

  if (keyword) {
    values.push(`%${keyword}%`);
    whereExtra = `AND (LOWER(m.home_team) LIKE LOWER($${values.length}) 
                   OR LOWER(m.away_team) LIKE LOWER($${values.length})
                   OR LOWER(l.name) LIKE LOWER($${values.length}))`;
  }

  const result = await query(
    `SELECT m.id, m.home_team, m.away_team, m.match_date,
            m.ticket_sale_open_at, st.name AS stadium_name,
            l.name AS league_name,
            (SELECT COALESCE(SUM(total_seats), 0)::int FROM stands s WHERE s.match_id = m.id) AS total_seats,
            (SELECT COUNT(*)::int FROM tickets t WHERE t.match_id = m.id AND t.status IN ('paid', 'checked_in')) AS sold_count
     FROM matches m
     LEFT JOIN stadiums st ON st.id = m.stadium_id
     LEFT JOIN leagues l ON l.id = m.league_id
     WHERE m.status IN ('published', 'upcoming')
       AND m.match_date > NOW()
       ${whereExtra}
     ORDER BY m.match_date ASC
     LIMIT 10`,
    values
  );

  return result.rows;
};

/**
 * Lấy thông tin availability (khán đài + giá) cho 1 trận.
 */
const getMatchAvailability = async (matchId) => {
  const stands = await matchesService.getAvailabilityByMatchId(matchId);
  const match = await matchesService.getById(matchId);
  return { match, stands };
};

/**
 * Parse action từ AI response.
 */
const parseAction = (text) => {
  const actionMatch = text.match(/###ACTION###\s*([\s\S]*?)\s*###END_ACTION###/);
  if (!actionMatch) return null;

  try {
    const actionData = JSON.parse(actionMatch[1].trim());
    const cleanText = text.replace(/###ACTION###[\s\S]*?###END_ACTION###/, "").trim();
    return { ...actionData, cleanText };
  } catch {
    return null;
  }
};

/**
 * Thực thi action và trả về context bổ sung cho AI.
 */
const executeAction = async (action, userId) => {
  switch (action.action) {
    case "search_matches": {
      const matches = await getActiveMatchesContext(action.params?.keyword);
      if (matches.length === 0) {
        return {
          actionType: "show_matches",
          actionData: [],
          contextForAI: "Không tìm thấy trận đấu nào phù hợp."
        };
      }
      const lines = matches.map((m) => {
        const available = m.total_seats - m.sold_count;
        const isHot = (m.total_seats > 0 && available < m.total_seats * 0.2) || available < 100 ? " [🔥 HOT - Sắp hết vé]" : "";
        return `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("vi-VN")} | Sân: ${m.stadium_name || "N/A"} | Còn: ${available} vé${isHot}`;
      });
      return {
        actionType: "show_matches",
        actionData: matches.map(m => ({
          id: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          matchDate: m.match_date,
          stadiumName: m.stadium_name,
          leagueName: m.league_name,
          availableSeats: m.total_seats - m.sold_count
        })),
        contextForAI: `Kết quả tìm kiếm:\n${lines.join("\n")}\n\nHãy liệt kê các trận cho user (KHÔNG hiện ID), nhấn mạnh các trận HOT và hỏi user: "Bạn muốn xem trận đấu nào?"`
      };
    }

    case "get_availability": {
      const { match, stands } = await getMatchAvailability(action.params?.match_id);
      if (!match) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Không tìm thấy trận đấu với ID này."
        };
      }
      const lines = stands.map(
        (s) => `- [StandID:${s.id}] Khán đài ${s.name} | Giá: ${Number(s.price).toLocaleString("vi-VN")} VND | Còn: ${s.available_seats}/${s.total_seats} ghế`
      );

      let priceAnalysis = "";
      if (stands.length > 0) {
        const sortedStands = [...stands].sort((a, b) => Number(a.price) - Number(b.price));
        const cheapest = sortedStands[0];
        const mostExpensive = sortedStands[sortedStands.length - 1];
        
        let avgStands = [];
        if (stands.length > 2) {
           avgStands = sortedStands.slice(1, -1);
        }

        priceAnalysis = `\n[Phân tích nội bộ để bạn tư vấn]:\n- Khán đài giá rẻ nhất (Tiết kiệm): ${cheapest.name} (${Number(cheapest.price).toLocaleString("vi-VN")} VND)\n- Khán đài giá cao nhất (Góc nhìn VIP/Tốt nhất): ${mostExpensive.name} (${Number(mostExpensive.price).toLocaleString("vi-VN")} VND)\n- Khán đài giá trung bình: ${avgStands.map(s => s.name).join(', ') || "Không có"}.`;
      }

      return {
        actionType: "show_availability",
        actionData: {
          match: {
            id: match.id,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            matchDate: match.match_date,
            stadiumName: match.stadium_name
          },
          stands: stands.map(s => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            availableSeats: s.available_seats,
            totalSeats: s.total_seats
          }))
        },
        contextForAI: `Thông tin khán đài trận ${match.home_team} vs ${match.away_team}:\n${lines.join("\n")}\n${priceAnalysis}\n\nHãy liệt kê cho user (KHÔNG hiện StandID). Sau đó bạn HỎI: "Bạn ưu tiên khán đài có view tốt nhất, giá rẻ tiết kiệm nhất, hay mức giá trung bình?" và hỏi số lượng vé họ cần.`
      };
    }

    case "create_booking": {
      const { match_id, stand_id, quantity } = action.params || {};
      if (!match_id || !stand_id || !quantity) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Thiếu thông tin đặt vé. Hãy hỏi user: cần match_id, stand_id, quantity."
        };
      }

      try {
        // Tạo pending tickets
        const tickets = await ticketsService.bookTickets({
          matchId: match_id,
          selections: [{ standId: stand_id, quantity }],
          userId
        });

        const ticketIds = tickets.map(t => t.id);

        // Tạo Stripe PaymentIntent
        const payment = await paymentsService.createIntent({
          userId,
          ticketIds,
          currency: "vnd"
        });

        // Lấy thông tin đơn hàng
        const match = await matchesService.getById(match_id);
        const stands = await matchesService.getAvailabilityByMatchId(match_id);
        const bookedStand = stands.find(s => Number(s.id) === Number(stand_id));

        return {
          actionType: "booking_created",
          actionData: {
            ticketIds,
            clientSecret: payment.clientSecret,
            matchId: match_id,
            standId: stand_id,
            matchName: `${match?.home_team || "?"} vs ${match?.away_team || "?"}`,
            matchDate: match?.match_date,
            stadiumName: match?.stadium_name,
            standName: bookedStand?.name || "N/A",
            standPrice: Number(bookedStand?.price || 0),
            quantity,
            totalAmount: Number(bookedStand?.price || 0) * quantity
          },
          contextForAI: `Đặt vé THÀNH CÔNG! ${quantity} vé khán đài ${bookedStand?.name || "N/A"} cho trận ${match?.home_team} vs ${match?.away_team}. Tổng: ${(Number(bookedStand?.price || 0) * quantity).toLocaleString("vi-VN")} VND. Nhắc user bấm nút "Thanh toán ngay" để hoàn tất.`
        };
      } catch (err) {
        return {
          actionType: "booking_failed",
          actionData: null,
          contextForAI: `Đặt vé THẤT BẠI: ${err.message}. Hãy thông báo lỗi cho user và gợi ý thử lại.`
        };
      }
    }

    default:
      return {
        actionType: "none",
        actionData: null,
        contextForAI: "Action không hợp lệ."
      };
  }
};

export const aiService = {
  /**
   * Chat với AI — hỗ trợ action execution.
   * @param {string} userId
   * @param {Array<{role: string, content: string}>} messages - Lịch sử chat từ client
   */
  async chat(userId, messages) {
    const OLLAMA_URL = process.env.OLLAMA_BASE_URL;
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
    const groq = getGroq();

    // Lấy context trận đấu hiện tại
    let matchContextLines = "";
    try {
      const matches = await getActiveMatchesContext();
      if (matches.length > 0) {
        const lines = matches.map(
          (m) => `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("vi-VN")} | Sân: ${m.stadium_name || "N/A"} | Giải: ${m.league_name || "N/A"}`
        );
        matchContextLines = `\n\nCác trận đấu đang mở bán:\n${lines.join("\n")}`;
      }
    } catch {
      // Bỏ qua nếu DB chưa sẵn sàng
    }

    const systemPrompt = SYSTEM_PROMPT + matchContextLines;
    const recentMessages = messages.slice(-10);

    // Gọi AI (Ollama -> Groq -> Offline fallback)
    let aiResponse = null;

    // 1. ƯU TIÊN OLLAMA (Local AI)
    if (OLLAMA_URL && !aiResponse) {
      try {
        const safeUrl = OLLAMA_URL.replace('localhost', '127.0.0.1');
        const ollamaController = new AbortController();
        const ollamaTimeout = setTimeout(() => ollamaController.abort(), 5000);
        const response = await fetch(`${safeUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ollamaController.signal,
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages
            ],
            stream: false,
            options: { temperature: 0.7, num_predict: MAX_TOKENS }
          })
        });
        clearTimeout(ollamaTimeout);
        if (response.ok) {
          const data = await response.json();
          aiResponse = {
            message: data.message?.content || "",
            provider: "ollama"
          };
        }
      } catch (error) {
        console.error("Ollama connection failed, falling back...", error.message);
      }
    }

    // 2. FALLBACK SANG GROQ (Cloud AI)
    if (!aiResponse && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
          max_tokens: MAX_TOKENS,
          temperature: 0.7
        });
        aiResponse = {
          message: completion.choices[0]?.message?.content ?? "",
          provider: "groq"
        };
      } catch (groqError) {
        console.error("Groq connection failed...", groqError.message);
      }
    }

    // 3. FALLBACK OFFLINE (Rule-based)
    if (!aiResponse) {
      aiResponse = await this._offlineFallback(messages, userId);
    }

    // Parse action nếu AI trả về action (hoặc fallback đã set sẵn)
    let finalAction = aiResponse.action || "none";
    let finalData = aiResponse.data || null;

    const parsedAction = parseAction(aiResponse.message);
    if (parsedAction || finalAction !== "none") {
      try {
        const actionToExec = parsedAction || { action: finalAction, params: finalData?.params || {} };
        const actionResult = await executeAction(actionToExec, userId);

        // Nếu là AI provider, gọi lại AI để compose reply
        if (aiResponse.provider !== "offline") {
          const followUpMessages = [
            ...recentMessages,
            { role: "assistant", content: parsedAction?.cleanText || "Đang xử lý..." },
            { role: "system", content: `Kết quả hành động: ${actionResult.contextForAI}\n\nHãy trả lời user dựa trên kết quả trên. KHÔNG trả về action nữa. KHÔNG hiển thị ID.` }
          ];

          let finalReply = actionResult.contextForAI;
          // ... (giữ nguyên logic gọi AI lần 2 ở đây)
          if (groq) {
            try {
              const completion2 = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{ role: "system", content: systemPrompt }, ...followUpMessages],
                max_tokens: MAX_TOKENS,
                temperature: 0.7
              });
              finalReply = completion2.choices[0]?.message?.content ?? finalReply;
            } catch { }
          } else if (OLLAMA_URL) {
            try {
              const safeUrl = OLLAMA_URL.replace('localhost', '127.0.0.1');
              const ollama2Controller = new AbortController();
              const ollama2Timeout = setTimeout(() => ollama2Controller.abort(), 5000);
              const response2 = await fetch(`${safeUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ollama2Controller.signal,
                body: JSON.stringify({
                  model: OLLAMA_MODEL,
                  messages: [{ role: 'system', content: systemPrompt }, ...followUpMessages],
                  stream: false,
                  options: { temperature: 0.7, num_predict: MAX_TOKENS }
                })
              });
              clearTimeout(ollama2Timeout);
              if (response2.ok) {
                const data2 = await response2.json();
                finalReply = data2.message?.content || finalReply;
              }
            } catch { }
          }
          
          return {
            message: finalReply.replace(/###ACTION###[\s\S]*?###END_ACTION###/g, "").trim(),
            action: actionResult.actionType,
            data: actionResult.actionData,
            provider: aiResponse.provider
          };
        }

        // Nếu là offline, trả về kết quả action luôn
        return {
          message: actionResult.contextForAI,
          action: actionResult.actionType,
          data: actionResult.actionData,
          provider: "offline"
        };
      } catch (actionError) {
        console.error("Action execution failed:", actionError.message);
      }
    }

    return {
      message: aiResponse.message,
      action: "none",
      data: null,
      provider: aiResponse.provider
    };
  },

  /**
   * Offline fallback — rule-based khi không có AI provider nào.
   */
  async _offlineFallback(messages, userId) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastMsg.toLowerCase();

    // 1. Xử lý logic Đặt vé (khi user click nút "Chọn" khán đài)
    // Pattern: "Đặt cho tôi 1 vé khán đài Khán đài A trận Hà Nội FC vs Hải Phòng"
    if (lowerMsg.includes("đặt") && lowerMsg.includes("khán đài")) {
      const matches = await getActiveMatchesContext();
      const match = matches.find(m => lowerMsg.includes(m.home_team.toLowerCase()) || lowerMsg.includes(m.away_team.toLowerCase()));
      
      if (match) {
        const { stands } = await getMatchAvailability(match.id);
        const stand = stands.find(s => lowerMsg.includes(s.name.toLowerCase()));
        
        if (stand) {
          return {
            message: `Đang tiến hành đặt vé cho bạn...`,
            action: "create_booking",
            data: { params: { match_id: match.id, stand_id: stand.id, quantity: 1 } },
            provider: "offline"
          };
        }
      }
    }

    // 2. Xử lý logic Xem giá/khán đài (khi user click nút "Chọn trận này")
    if (lowerMsg.includes("khán đài") || lowerMsg.includes("giá vé")) {
      const matches = await getActiveMatchesContext();
      const match = matches.find(m => lowerMsg.includes(m.home_team.toLowerCase()) || lowerMsg.includes(m.away_team.toLowerCase()));
      
      if (match) {
        return {
          message: `Đây là thông tin khán đài cho trận ${match.home_team} vs ${match.away_team}. Bạn ưu tiên khán đài có view tốt nhất, giá rẻ tiết kiệm nhất, hay mức giá trung bình?`,
          action: "get_availability",
          data: { params: { match_id: match.id } },
          provider: "offline"
        };
      }
    }

    // 3. Xử lý Tìm kiếm trận đấu
    if (lowerMsg.includes("đặt vé") || lowerMsg.includes("lịch") || lowerMsg.includes("trận")) {
      const keyword = lowerMsg.replace(/đặt vé|lịch thi đấu|trận đấu|tìm/g, "").trim();
      return {
        message: keyword ? `Đang tìm các trận đấu liên quan đến "${keyword}". Bạn muốn xem trận đấu nào?` : "Dưới đây là các trận đấu sắp tới. Bạn muốn xem trận đấu nào?",
        action: "search_matches",
        data: { params: { keyword: keyword || undefined } },
        provider: "offline"
      };
    }

    // 4. Chào hỏi
    if (lowerMsg.includes("chào") || lowerMsg.includes("hi") || lowerMsg.includes("hello")) {
      return {
        message: "Chào bạn! 👋 Mình là chuyên gia tư vấn vé của GoTicket. Mình có thể giúp bạn tìm trận đấu HOT nhất. Bạn muốn xem lịch thi đấu trận nào?",
        provider: "offline"
      };
    }

    return {
      message: "Xin chào! Mình là tư vấn viên GoTicket. Bạn đang quan tâm đến trận đấu nào để mình tư vấn khán đài có view tốt nhất nhé!",
      provider: "offline"
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
