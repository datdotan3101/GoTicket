import { getGroq } from "../../config/groq.js";
import { query } from "../../config/db.js";
import { ticketsService } from "../tickets/tickets.service.js";
import { paymentsService } from "../payments/payments.service.js";
import { matchesService } from "../matches/matches.service.js";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_TOKENS = 1024;

/**
 * System prompt — tells the AI the context and how to use actions.
 */
const SYSTEM_PROMPT = `You are an AI sports ticket advisor for GoTicket — an online ticketing platform.
Role: Be a proactive, professional, and enthusiastic advisor. Your job is not just to provide information, but also to SUGGEST and ANALYZE to help users make the best decisions.

Important rules:
- Respond in English, in a friendly and natural manner like an expert consultant.
- NEVER display raw IDs (such as match IDs, Stand IDs) to the user.
- When listing matches or stands, use a numbered list or clear bullet points.

Standard CONSULTATION process:
1. SHOW MATCHES: When user asks, show a list of matches, especially highlighting "HOT" matches (nearly sold out). Then ASK: "Which match are you interested in?"
2. ADVISE ON STANDS: Once the user has chosen a match, use an action to get the stand list. Instead of just listing them, you MUST ADVISE: "Do you prefer the best view (VIP stand), the most budget-friendly, or a mid-range option?" Use the information provided to name which stand is VIP and which is cheapest.
3. CONFIRM QUANTITY AND BOOK: After the user chooses a stand, ask how many tickets they need (if not yet stated). Once you have all information, proceed to create the booking.
4. PAYMENT: After a successful booking, congratulate them and remind them to click the Pay Now button.

When you need to perform an action to fetch data or book tickets, you MUST return JSON in the following special block:
###ACTION###
{"action": "action_name", "params": {...}}
###END_ACTION###

Available actions:
1. search_matches - Get list of matches currently on sale. Params: {"keyword": "team/league name (optional)"}
2. get_availability - View stand info + pricing for a match. Params: {"match_id": number}
3. create_booking - Create a booking order. Params: {"match_id": number, "stand_id": number, "quantity": number}

Note: Return a MAXIMUM of ONE action at a time. Keep responses concise and focused on the current step.`;

/**
 * Fetch currently available matches to provide as context to AI.
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
 * Fetch availability info (stands + pricing) for a single match.
 */
const getMatchAvailability = async (matchId) => {
  const stands = await matchesService.getAvailabilityByMatchId(matchId);
  const match = await matchesService.getById(matchId);
  return { match, stands };
};

/**
 * Parse action from AI response.
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
 * Execute an action and return additional context for the AI.
 */
const executeAction = async (action, userId) => {
  switch (action.action) {
    case "search_matches": {
      const matches = await getActiveMatchesContext(action.params?.keyword);
      if (matches.length === 0) {
        return {
          actionType: "show_matches",
          actionData: [],
          contextForAI: "No matching matches found."
        };
      }
      const lines = matches.map((m) => {
        const available = m.total_seats - m.sold_count;
        const isHot = (m.total_seats > 0 && available < m.total_seats * 0.2) || available < 100 ? " [🔥 HOT - Almost sold out]" : "";
        return `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("en-US")} | Stadium: ${m.stadium_name || "N/A"} | Available: ${available} tickets${isHot}`;
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
        contextForAI: `Search results:\n${lines.join("\n")}\n\nList the matches for the user (DO NOT show IDs), emphasize HOT matches and ask: "Which match are you interested in?"`
      };
    }

    case "get_availability": {
      const { match, stands } = await getMatchAvailability(action.params?.match_id);
      if (!match) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Match not found with this ID."
        };
      }
      const lines = stands.map(
        (s) => `- [StandID:${s.id}] Stand ${s.name} | Price: ${Number(s.price).toLocaleString("en-US")} VND | Available: ${s.available_seats}/${s.total_seats} seats`
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

        priceAnalysis = `\n[Internal analysis for your advisory]:\n- Cheapest stand (Budget): ${cheapest.name} (${Number(cheapest.price).toLocaleString("en-US")} VND)\n- Most expensive stand (VIP/Best view): ${mostExpensive.name} (${Number(mostExpensive.price).toLocaleString("en-US")} VND)\n- Mid-range stands: ${avgStands.map(s => s.name).join(', ') || "None"}.`;
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
        contextForAI: `Stand information for ${match.home_team} vs ${match.away_team}:\n${lines.join("\n")}\n${priceAnalysis}\n\nList the stands for the user (DO NOT show StandIDs). Then ASK: "Do you prefer the best view stand, the most budget-friendly, or a mid-range option?" and ask how many tickets they need.`
      };
    }

    case "create_booking": {
      const { match_id, stand_id, quantity } = action.params || {};
      if (!match_id || !stand_id || !quantity) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Missing booking information. Ask the user for: match_id, stand_id, quantity."
        };
      }

      try {
        // Create pending tickets
        const tickets = await ticketsService.bookTickets({
          matchId: match_id,
          selections: [{ standId: stand_id, quantity }],
          userId
        });

        const ticketIds = tickets.map(t => t.id);

        // Create Stripe PaymentIntent
        const payment = await paymentsService.createIntent({
          userId,
          ticketIds,
          currency: "vnd"
        });

        // Fetch order details
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
          contextForAI: `Booking SUCCESSFUL! ${quantity} ticket(s) for stand ${bookedStand?.name || "N/A"} for the match ${match?.home_team} vs ${match?.away_team}. Total: ${(Number(bookedStand?.price || 0) * quantity).toLocaleString("en-US")} VND. Remind the user to click the "Pay Now" button to complete.`
        };
      } catch (err) {
        return {
          actionType: "booking_failed",
          actionData: null,
          contextForAI: `Booking FAILED: ${err.message}. Inform the user of the error and suggest trying again.`
        };
      }
    }

    default:
      return {
        actionType: "none",
        actionData: null,
        contextForAI: "Invalid action."
      };
  }
};

export const aiService = {
  /**
   * Chat with AI — supports action execution.
   * @param {string} userId
   * @param {Array<{role: string, content: string}>} messages - Chat history from client
   */
  async chat(userId, messages) {
    const OLLAMA_URL = process.env.OLLAMA_BASE_URL;
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
    const groq = getGroq();

    // Fetch current match context
    let matchContextLines = "";
    try {
      const matches = await getActiveMatchesContext();
      if (matches.length > 0) {
        const lines = matches.map(
          (m) => `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("en-US")} | Stadium: ${m.stadium_name || "N/A"} | League: ${m.league_name || "N/A"}`
        );
        matchContextLines = `\n\nCurrently available matches:\n${lines.join("\n")}`;
      }
    } catch {
      // Ignore if DB is not ready
    }

    const systemPrompt = SYSTEM_PROMPT + matchContextLines;
    const recentMessages = messages.slice(-10);

    // Call AI (Ollama -> Groq -> Offline fallback)
    let aiResponse = null;

    // 1. PREFER OLLAMA (Local AI)
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

    // 2. FALLBACK TO GROQ (Cloud AI)
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

    // 3. OFFLINE FALLBACK (Rule-based)
    if (!aiResponse) {
      aiResponse = await this._offlineFallback(messages, userId);
    }

    // Parse action if AI returned an action (or fallback already set one)
    let finalAction = aiResponse.action || "none";
    let finalData = aiResponse.data || null;

    const parsedAction = parseAction(aiResponse.message);
    if (parsedAction || finalAction !== "none") {
      try {
        const actionToExec = parsedAction || { action: finalAction, params: finalData?.params || {} };
        const actionResult = await executeAction(actionToExec, userId);

        // If AI provider, call AI again to compose reply
        if (aiResponse.provider !== "offline") {
          const followUpMessages = [
            ...recentMessages,
            { role: "assistant", content: parsedAction?.cleanText || "Processing..." },
            { role: "system", content: `Action result: ${actionResult.contextForAI}\n\nRespond to the user based on the result above. Do NOT return another action. Do NOT display IDs.` }
          ];

          let finalReply = actionResult.contextForAI;
          // Call AI a second time for final composed reply
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

        // If offline, return action result directly
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
   * Offline fallback — rule-based when no AI provider is available.
   */
  async _offlineFallback(messages, userId) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastMsg.toLowerCase();

    // 1. Handle booking logic (when user clicks "Select" stand button)
    // Pattern: "Book me 1 ticket for stand A in match Team A vs Team B"
    if ((lowerMsg.includes("book") || lowerMsg.includes("buy")) && lowerMsg.includes("stand")) {
      const matches = await getActiveMatchesContext();
      const match = matches.find(m => lowerMsg.includes(m.home_team.toLowerCase()) || lowerMsg.includes(m.away_team.toLowerCase()));
      
      if (match) {
        const { stands } = await getMatchAvailability(match.id);
        const stand = stands.find(s => lowerMsg.includes(s.name.toLowerCase()));
        
        if (stand) {
          return {
            message: `Processing your booking...`,
            action: "create_booking",
            data: { params: { match_id: match.id, stand_id: stand.id, quantity: 1 } },
            provider: "offline"
          };
        }
      }
    }

    // 2. Handle stand info / pricing (when user clicks "Select this match" button)
    if (lowerMsg.includes("stand") || lowerMsg.includes("ticket price") || lowerMsg.includes("pricing")) {
      const matches = await getActiveMatchesContext();
      const match = matches.find(m => lowerMsg.includes(m.home_team.toLowerCase()) || lowerMsg.includes(m.away_team.toLowerCase()));
      
      if (match) {
        return {
          message: `Here is the stand information for ${match.home_team} vs ${match.away_team}. Do you prefer the best view stand, the most budget-friendly, or a mid-range option?`,
          action: "get_availability",
          data: { params: { match_id: match.id } },
          provider: "offline"
        };
      }
    }

    // 3. Handle match search
    if (lowerMsg.includes("ticket") || lowerMsg.includes("schedule") || lowerMsg.includes("match") || lowerMsg.includes("book")) {
      const keyword = lowerMsg.replace(/ticket|schedule|match|book|find|search/g, "").trim();
      return {
        message: keyword ? `Searching for matches related to "${keyword}". Which match are you interested in?` : "Here are the upcoming matches. Which one would you like to see?",
        action: "search_matches",
        data: { params: { keyword: keyword || undefined } },
        provider: "offline"
      };
    }

    // 4. Greeting
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      return {
        message: "Hello! 👋 I'm your GoTicket ticket advisor. I can help you find the hottest matches. Which match are you interested in?",
        provider: "offline"
      };
    }

    return {
      message: "Hello! I'm the GoTicket advisor. Which match are you interested in? I can help you find the best stand with the greatest view!",
      provider: "offline"
    };
  },

  /**
   * Recommend matches based on user preferences (primary_sport_id).
   * Cache for 5 minutes on the client side (Cache-Control header returned from controller).
   * @param {string} userId
   */
  async getRecommendations(userId) {
    // Fetch user's sport preferences
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
      // Prioritize matches in preferred sports via league.sport_id
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
