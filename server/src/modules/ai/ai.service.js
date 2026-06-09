import { getGemini } from "../../config/gemini.js";
import { query } from "../../config/db.js";
import { ticketsService } from "../tickets/tickets.service.js";
import { paymentsService } from "../payments/payments.service.js";
import { matchesService } from "../matches/matches.service.js";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TOKENS = 1024;

/**
 * System prompt — tells the AI the context and how to use actions.
 */
const SYSTEM_PROMPT = `You are an AI sports ticket advisor for GoTicket — an online ticketing platform.
Role: Be a proactive, professional, and enthusiastic advisor. Your job is not just to provide information, but also to SUGGEST and ANALYZE to help users make the best decisions.

Other important rules:
- NEVER display raw IDs (such as match IDs, Stand IDs) to the user.
- Do NOT use Markdown formatting (no **, *, _, etc.). Provide plain text only.
- Do NOT use emojis or icons in your responses.
- Keep responses concise — the match cards will be shown automatically by the UI, so you do NOT need to list matches in your text response.

Standard CONSULTATION process:
1. SHOW MATCHES: When the user asks about matches (e.g. "show matches", "upcoming schedules", etc.), immediately trigger the search_matches action. The UI will display interactive match cards automatically. Just write a short, friendly intro (e.g., "Here are the upcoming matches!").
2. ADVISE ON STANDS: 
   - If the user explicitly specifies the exact match they want (e.g., mentioning both teams like "team A vs team B"), or if there is exactly ONE match on sale for the team they mentioned, immediately use the get_availability action using that match's ID. Do NOT use search_matches if the specific match is already identified.
   - ONLY use search_matches if the user is vague and there are multiple matches to choose from.
   - Once availability is shown, advise on stand choices — VIP for best view, budget-friendly, or mid-range.
3. CONFIRM QUANTITY AND BOOK: After the user chooses a stand, ask how many tickets they need (if not stated). Then create the booking.
4. PAYMENT: After a successful booking, congratulate them and remind them to click the Pay Now button.

When you need to perform an action to fetch data or book tickets, you MUST return JSON in the following special block:
###ACTION###
{"action": "action_name", "params": {...}}
###END_ACTION###

Available actions:
1. search_matches - Get list of matches currently on sale. Params: {"keyword": "specific team or league name only (optional, leave empty or omit when user asks generally)"}
   IMPORTANT: Only set keyword if the user mentions a SPECIFIC team name (e.g. "Manchester", "Arsenal") or league name. For general requests like "show matches", "upcoming", "schedule" — always leave keyword empty: {"keyword": ""}
2. get_availability - View stand info + pricing for a match. Params: {"match_id": number}
3. create_booking - Create a booking order. Params: {"match_id": number, "stand_id": number, "quantity": number}
   IMPORTANT FOR BOOKING: You MUST extract the exact quantity of tickets the user requested (e.g., if user says "Book me 2 tickets", quantity is 2).

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
     WHERE m.status IN ('published', 'upcoming', 'approved')
       AND m.match_date > NOW()
       ${whereExtra}
     ORDER BY 
       CASE WHEN m.ticket_sale_open_at IS NULL OR m.ticket_sale_open_at <= NOW() THEN 0 ELSE 1 END ASC,
       m.match_date ASC
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
 * Strip internal markers (IDs) from text before sending to user.
 */
const stripInternalMarkers = (text) =>
  text
    .replace(/\[ID:\d+\]/g, "")
    .replace(/\[StandID:\d+\]/g, "")
    .replace(/\[INTERNAL_STAND_MAP[\s\S]*?\n\n/g, "")
    .replace(/\[Internal analysis[\s\S]*?\n\n/g, "")
    .replace(/###ACTION###[\s\S]*?###END_ACTION###/g, "")
    .replace(/\*\*/g, "") // Strip bold asterisks
    .replace(/\n\*\s/g, "\n- ") // Convert bullet points
    .trim();

/**
 * Execute an action and return additional context for the AI.
 */
const executeAction = async (action, userId) => {
  switch (action.action) {
    case "search_matches": {
      const keyword = action.params?.keyword?.trim() || "";
      let matches = keyword ? await getActiveMatchesContext(keyword) : [];
      // If keyword search returns nothing (or no keyword), fall back to all matches
      if (matches.length === 0) {
        matches = await getActiveMatchesContext();
      }
      if (matches.length === 0) {
        return {
          actionType: "show_matches",
          actionData: [],
          contextForAI: "No matches are currently available."
        };
      }
      const lines = matches.map((m) => {
        const isOpen = !m.ticket_sale_open_at || new Date(m.ticket_sale_open_at) <= new Date();
        const available = m.total_seats - m.sold_count;
        const isHot = isOpen && ((m.total_seats > 0 && available < m.total_seats * 0.2) || available < 100) ? " [HOT - Almost sold out]" : "";
        const statusText = isOpen ? `Available: ${available} tickets${isHot}` : `COMING SOON (Sale opens at ${new Date(m.ticket_sale_open_at).toLocaleString("en-US")})`;
        return `- [ID:${m.id}] ${m.home_team} vs ${m.away_team} | ${new Date(m.match_date).toLocaleString("en-US")} | Stadium: ${m.stadium_name || "N/A"} | ${statusText}`;
      });
      return {
        actionType: "show_matches",
        actionData: matches.map(m => ({
          id: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          matchDate: m.match_date,
          ticketSaleOpenAt: m.ticket_sale_open_at,
          stadiumName: m.stadium_name,
          leagueName: m.league_name,
          availableSeats: m.total_seats - m.sold_count
        })),
        contextForAI: `Search results:\n${lines.join("\n")}`,
        userMessage: matches.length > 0 
          ? `Found ${matches.length} match(es)! Which one are you interested in?` 
          : "No matches found matching your criteria."
      };
    }

    case "get_availability": {
      const { match, stands } = await getMatchAvailability(action.params?.match_id);
      if (!match) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Match not found with this ID.",
          userMessage: "Sorry, I couldn't find information for this match."
        };
      }

      const isComingSoon = match.ticket_sale_open_at && new Date(match.ticket_sale_open_at) > new Date();
      if (isComingSoon) {
        // Fetch recommendations (only currently open matches)
        let activeMatches = await getActiveMatchesContext("");
        activeMatches = activeMatches.filter(m => !m.ticket_sale_open_at || new Date(m.ticket_sale_open_at) <= new Date());
        
        
        return {
          actionType: "show_matches",
          actionData: activeMatches.map(m => ({
            id: m.id,
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            matchDate: m.match_date,
            ticketSaleOpenAt: m.ticket_sale_open_at,
            stadiumName: m.stadium_name,
            leagueName: m.league_name,
            availableSeats: m.total_seats - m.sold_count
          })),
          contextForAI: `Action failed: The match ${match.home_team} vs ${match.away_team} is NOT on sale yet. Ticket sales will open at ${new Date(match.ticket_sale_open_at).toLocaleString("en-US")}.`,
          userMessage: `The match ${match.home_team} vs ${match.away_team} is not on sale yet. Ticket sales will open on ${new Date(match.ticket_sale_open_at).toLocaleString("en-US")}. Here are other matches currently on sale:`
        };
      }

      // Lines shown to user (no IDs)
      const lines = stands.map(
        (s) => `- Stand ${s.name} | Price: ${Number(s.price).toLocaleString("en-US")} VND | Available: ${s.available_seats}/${s.total_seats} seats`
      );

      // Internal ID mapping for AI to use in create_booking (stripped before sending to user)
      const idMap = stands.map(
        (s) => `  Stand Name: "${s.name}" => EXACT stand_id to use: ${s.id}`
      ).join("\n");

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
        contextForAI: `Stand information for ${match.home_team} vs ${match.away_team}:\n${lines.join("\n")}\n${priceAnalysis}\n\n[INTERNAL_STAND_MAP - use these IDs for create_booking, DO NOT show to user]:\n${idMap}\n\nAdvise the user on their stand options based on the price analysis. Briefly recommend the cheapest stand for budget, the most expensive for the best view, and the mid-range options. Then ask which one they prefer and how many tickets they need.`,
        userMessage: `Here is the stand information for ${match.home_team} vs ${match.away_team}. Which stand would you like, and how many tickets?`
      };
    }

    case "create_booking": {
      const { match_id, stand_id, quantity } = action.params || {};
      const numQuantity = Number(quantity);
      const numStandId = Number(stand_id);
      
      if (!match_id || !numStandId || !numQuantity || numQuantity <= 0) {
        return {
          actionType: "none",
          actionData: null,
          contextForAI: "Missing or invalid booking information. Ask the user to select a valid stand from the list and specify the number of tickets.",
          userMessage: "I need more information to book tickets. Please select a match, a stand, and the number of tickets."
        };
      }

      try {
        // Create pending tickets
        const tickets = await ticketsService.bookTickets({
          matchId: match_id,
          selections: [{ standId: stand_id, quantity: numQuantity }],
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
        const standPrice = Number(bookedStand?.price || 0);

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
            standPrice: standPrice,
            quantity: numQuantity,
            totalAmount: standPrice * numQuantity
          },
          contextForAI: `Booking SUCCESSFUL! ${numQuantity} ticket(s) for stand ${bookedStand?.name || "N/A"} for the match ${match?.home_team} vs ${match?.away_team}. Total: ${(standPrice * numQuantity).toLocaleString("en-US")} VND. Remind the user to click the "Pay Now" button to complete.`,
          userMessage: `Booking successful! You reserved ${numQuantity} ticket(s) in stand ${bookedStand?.name || "N/A"} for ${match?.home_team} vs ${match?.away_team}. Total: ${(standPrice * numQuantity).toLocaleString("en-US")} VND. Please click "Pay Now" to complete your purchase.`
        };
      } catch (err) {
        return {
          actionType: "booking_failed",
          actionData: null,
          contextForAI: `Booking FAILED: ${err.message}. Inform the user of the error and suggest trying again.`,
          userMessage: `Sorry, booking failed: ${err.message}. Please try again.`
        };
      }
    }

    default:
      return {
        actionType: "none",
        actionData: null,
        contextForAI: "Invalid action.",
        userMessage: "Invalid action."
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

    // Call AI (Gemini -> Offline fallback)
    let aiResponse = null;
    const gemini = getGemini();

    // 1. PREFER GEMINI (Google AI)
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 }
        });

        // Convert messages to Gemini format (role: user/model, no system)
        const history = recentMessages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const lastUserMsg = recentMessages[recentMessages.length - 1]?.content || "";

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastUserMsg);
        const text = result.response.text();

        aiResponse = { message: text, provider: "gemini" };
      } catch (geminiError) {
        console.error("Gemini connection failed, falling back to offline...", geminiError.message);
      }
    }

    // 2. OFFLINE FALLBACK (Rule-based)
    if (!aiResponse) {
      aiResponse = await this._offlineFallback(messages);
    }

    // Parse action if AI returned an action (or fallback already set one)
    let finalAction = aiResponse.action || "none";
    let finalData = aiResponse.data || null;

    const parsedAction = parseAction(aiResponse.message);
    if (parsedAction || finalAction !== "none") {
      try {
        const actionToExec = parsedAction || { action: finalAction, params: finalData?.params || {} };
        const actionResult = await executeAction(actionToExec, userId);

        // If Gemini provider, call AI again to compose a natural reply
        if (aiResponse.provider === "gemini" && gemini) {
          let finalReply = actionResult.contextForAI;
          try {
            const model2 = gemini.getGenerativeModel({
              model: GEMINI_MODEL,
              systemInstruction: systemPrompt,
              generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 }
            });
            const followUpHistory = recentMessages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }));
            const chat2 = model2.startChat({ history: followUpHistory });
            const result2 = await chat2.sendMessage(
              `Action result: ${actionResult.contextForAI}\n\nRespond to the user based on this result. Do NOT return another action. Do NOT display IDs.`
            );
            finalReply = result2.response.text() || finalReply;
          } catch { /* ignore error */ }

          return {
            message: stripInternalMarkers(finalReply),
            action: actionResult.actionType,
            data: actionResult.actionData,
            provider: "gemini"
          };
        }

        // Offline provider: return action result directly
        return {
          message: actionResult.userMessage || aiResponse.message,
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
  async _offlineFallback(messages) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastMsg.toLowerCase();

    // Pre-fetch active matches to help with intent recognition
    const matches = await getActiveMatchesContext();
    const mentionedMatch = matches.find(m => 
      lowerMsg.includes(m.home_team.toLowerCase()) || 
      lowerMsg.includes(m.away_team.toLowerCase())
    );

    // 1. Handle booking logic (when user clicks "Select" stand button or specifies a stand)
    if ((lowerMsg.includes("book") || lowerMsg.includes("buy") || lowerMsg.includes("ticket")) && lowerMsg.includes("stand")) {
      if (mentionedMatch) {
        const { stands } = await getMatchAvailability(mentionedMatch.id);
        const stand = stands.find(s => lowerMsg.includes(s.name.toLowerCase()));
        
        if (stand) {
          const qtyMatch = lowerMsg.match(/(\d+)\s*ticket/);
          const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
          
          return {
            message: `Processing your booking...`,
            action: "create_booking",
            data: { params: { match_id: mentionedMatch.id, stand_id: stand.id, quantity } },
            provider: "offline"
          };
        }
      }
    }

    // 2. Handle stand info / pricing (if user mentions a team and wants to buy or see prices)
    if (mentionedMatch && (lowerMsg.includes("stand") || lowerMsg.includes("ticket") || lowerMsg.includes("price") || lowerMsg.includes("pricing") || lowerMsg.includes("buy") || lowerMsg.includes("book") || lowerMsg.includes("want"))) {
      return {
        message: `Here is the stand information for ${mentionedMatch.home_team} vs ${mentionedMatch.away_team}. Which stand would you like, and how many tickets?`,
        action: "get_availability",
        data: { params: { match_id: mentionedMatch.id } },
        provider: "offline"
      };
    }

    // 3. If they just mention a team name but no specific buy intent
    if (mentionedMatch) {
      return {
        message: `I found a match for ${mentionedMatch.home_team} vs ${mentionedMatch.away_team}! Would you like to see the ticket prices?`,
        action: "search_matches",
        data: { params: { keyword: mentionedMatch.home_team } },
        provider: "offline"
      };
    }

    // 4. Handle match search
    const matchKeywordsEn = ["ticket", "schedule", "match", "book", "game", "upcoming", "fixture", "event", "buy", "want", "find", "search"];
    const isMatchQuery = matchKeywordsEn.some(kw => lowerMsg.includes(kw));
    
    if (isMatchQuery) {
      const stopWordsPattern = /ticket|schedule|match|book|find|search|i want|buy|want to/g;
      const keyword = lowerMsg.replace(stopWordsPattern, "").trim();
      return {
        message: keyword ? `Searching for matches related to "${keyword}". Which match are you interested in?` : "Here are the upcoming matches. Which one would you like to see?",
        action: "search_matches",
        data: { params: { keyword: keyword || undefined } },
        provider: "offline"
      };
    }

    // 5. Greeting
    const greetKeywords = ["hello", "hi", "hey"];
    if (greetKeywords.some(kw => lowerMsg.includes(kw))) {
      return {
        message: "Hello! I'm your GoTicket Advisor. I can help you find the hottest matches and book tickets right in the chat. Which match are you interested in?",
        provider: "offline"
      };
    }

    return {
      message: "Hello! I'm your GoTicket Advisor. Need help checking match schedules or booking tickets? Just ask!",
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
