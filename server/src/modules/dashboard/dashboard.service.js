import { query } from "../../config/db.js";

export const dashboardService = {
  /**
   * Admin: System-wide revenue.
   * - Total revenue, total paid/checked_in tickets
   * - Revenue by sport
   * - Top 5 matches by revenue
   * - Last 30 days revenue trend (by day)
   */
  async getAdminRevenue() {
    const [summary, bySport, topClubs, trend, operations, growth] = await Promise.all([
      // TIER 1: Overview (KPI)
      query(`
        SELECT
          COALESCE(SUM(p.amount), 0)::numeric AS total_revenue,
          COUNT(DISTINCT t.id)::int AS total_tickets,
          (SELECT COUNT(*)::int FROM matches WHERE status = 'published') AS total_open_matches,
          (SELECT COUNT(*)::int FROM seats) AS total_system_seats,
          COUNT(DISTINCT t.user_id)::int AS total_buyers
        FROM tickets t
        JOIN payments p ON p.ticket_id = t.id
        WHERE t.status IN ('paid', 'checked_in')
          AND p.status = 'succeeded'
      `),

      // TIER 3: Revenue by sport (For Pie Chart)
      query(`
        SELECT
          s.name AS sport_name,
          COALESCE(SUM(p.amount), 0)::numeric AS revenue
        FROM sports s
        LEFT JOIN leagues l ON l.sport_id = s.id
        LEFT JOIN matches m ON m.league_id = l.id
        LEFT JOIN tickets t ON t.match_id = m.id AND t.status IN ('paid', 'checked_in')
        LEFT JOIN payments p ON p.ticket_id = t.id AND p.status = 'succeeded'
        GROUP BY s.id, s.name
        HAVING COALESCE(SUM(p.amount), 0) > 0
        ORDER BY revenue DESC
      `),

      // TIER 2: Top 5 clubs by revenue
      query(`
        SELECT
          c.id, c.name,
          COALESCE(SUM(p.amount), 0)::numeric AS revenue,
          COUNT(t.id)::int AS tickets_sold,
          (SELECT COUNT(*)::int FROM matches WHERE club_id = c.id) AS matches_count,
          COALESCE(
            COUNT(t.id)::numeric / NULLIF((SELECT COUNT(*) FROM seats s JOIN matches m2 ON m2.id = s.match_id WHERE m2.club_id = c.id), 0) * 100, 
            0
          )::numeric AS fill_rate,
          (SELECT full_name FROM users WHERE club_id = c.id AND role = 'manager' LIMIT 1) AS manager_name
        FROM clubs c
        LEFT JOIN matches m ON m.club_id = c.id
        LEFT JOIN tickets t ON t.match_id = m.id AND t.status IN ('paid', 'checked_in')
        LEFT JOIN payments p ON p.ticket_id = t.id AND p.status = 'succeeded'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT 5
      `),

      // TIER 3: 30-day trend (For Line Chart)
      query(`
        SELECT
          DATE(p.paid_at) AS day,
          COALESCE(SUM(p.amount), 0)::numeric AS revenue
        FROM payments p
        WHERE p.status = 'succeeded'
          AND p.paid_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(p.paid_at)
        ORDER BY day ASC
      `),

      // TIER 4: Operations status
      query(`
        SELECT 
          id, home_team, away_team, match_date, status,
          (SELECT COUNT(*) FROM tickets WHERE match_id = m.id AND status IN ('paid', 'checked_in'))::int AS sold,
          (SELECT COUNT(*) FROM seats WHERE match_id = m.id)::int AS total_seats
        FROM matches m
        WHERE status IN ('published', 'approved', 'canceled')
        ORDER BY match_date ASC
      `),

      // Growth comparison (vs yesterday)
      query(`
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded' AND DATE(paid_at) = CURRENT_DATE)::numeric AS today_revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded' AND DATE(paid_at) = CURRENT_DATE - 1)::numeric AS yesterday_revenue
      `)
    ]);

    return {
      summary: summary.rows[0],
      bySport: bySport.rows,
      topClubs: topClubs.rows,
      revenueTrend: trend.rows,
      operations: operations.rows,
      growth: growth.rows[0]
    };
  },

  /**
   * Manager: Revenue for their club.
   * - Total revenue + tickets for the club
   * - Revenue by match (only matches of the club)
   * - Revenue by stand (aggregate across matches)
   */
  async getManagerRevenue(clubId) {
    const [summary, byMatch] = await Promise.all([
      // Club overview
      query(`
        SELECT
          COALESCE(SUM(p.amount), 0)::numeric AS total_revenue,
          COUNT(DISTINCT t.id)::int AS total_tickets,
          COUNT(DISTINCT t.match_id)::int AS total_matches
        FROM matches m
        JOIN tickets t ON t.match_id = m.id AND t.status IN ('paid', 'checked_in')
        JOIN payments p ON p.ticket_id = t.id AND p.status = 'succeeded'
        WHERE m.club_id = $1
      `, [clubId]),

      // Revenue by match
      query(`
        SELECT
          m.id AS match_id,
          m.home_team, m.away_team, m.match_date, m.status,
          m.stadium_id, m.ticket_sale_open_at, m.description,
          s.name AS stadium_name, s.city AS stadium_city,
          COALESCE(SUM(p.amount), 0)::numeric AS revenue,
          COUNT(t.id)::int AS tickets_sold,
          COALESCE(total.total_seats, 0)::int AS total_seats
        FROM matches m
        LEFT JOIN stadiums s ON s.id = m.stadium_id
        LEFT JOIN tickets t ON t.match_id = m.id AND t.status IN ('paid', 'checked_in')
        LEFT JOIN payments p ON p.ticket_id = t.id AND p.status = 'succeeded'
        LEFT JOIN (
          SELECT match_id, COUNT(*)::int AS total_seats FROM seats GROUP BY match_id
        ) total ON total.match_id = m.id
        WHERE m.club_id = $1
        GROUP BY m.id, m.home_team, m.away_team, m.match_date, m.status, m.stadium_id, m.ticket_sale_open_at, m.description, s.name, s.city, total.total_seats
        ORDER BY m.match_date DESC
      `, [clubId])
    ]);

    return {
      summary: summary.rows[0],
      byMatch: byMatch.rows
    };
  },

  /**
   * Manager: Detailed analytics for a single match.
   * Verifies the match belongs to the manager's club (security).
   */
  async getMatchAnalytics(matchId, clubId) {
    // Verify match belongs to this club
    const matchCheck = await query(
      "SELECT id, home_team, away_team, match_date, status, club_id FROM matches WHERE id = $1",
      [matchId]
    );
    if (matchCheck.rowCount === 0) {
      throw Object.assign(new Error("Match not found."), { statusCode: 404 });
    }
    const match = matchCheck.rows[0];
    if (Number(match.club_id) !== Number(clubId)) {
      throw Object.assign(new Error("You do not have permission to view analytics for this match."), { statusCode: 403 });
    }

    const [byStand, checkinStats, peakHours] = await Promise.all([
      // Fill rate and revenue by stand
      query(`
        SELECT
          st.name AS stand_name,
          st.total_seats,
          st.price,
          COUNT(t.id) FILTER (WHERE t.status IN ('paid', 'checked_in'))::int AS sold,
          COUNT(t.id) FILTER (WHERE t.status = 'checked_in')::int AS checked_in,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'succeeded'), 0)::numeric AS revenue,
          ROUND(
            COUNT(t.id) FILTER (WHERE t.status IN ('paid', 'checked_in'))::numeric
            / NULLIF(st.total_seats, 0) * 100, 1
          ) AS fill_rate_pct
        FROM stands st
        LEFT JOIN seats s ON s.stand_id = st.id
        LEFT JOIN tickets t ON t.seat_id = s.id
        LEFT JOIN payments p ON p.ticket_id = t.id
        WHERE st.match_id = $1
        GROUP BY st.id, st.name, st.total_seats, st.price
        ORDER BY st.name
      `, [matchId]),

      // Total check-in stats
      query(`
        SELECT
          COUNT(*)::int AS total_tickets,
          COUNT(*) FILTER (WHERE status IN ('paid', 'checked_in'))::int AS paid_tickets,
          COUNT(*) FILTER (WHERE status = 'checked_in')::int AS checked_in_tickets
        FROM tickets WHERE match_id = $1
      `, [matchId]),

      // Peak hours (ticket purchase histogram)
      query(`
        SELECT
          EXTRACT(HOUR FROM t.created_at)::int AS hour,
          COUNT(*)::int AS orders
        FROM tickets t
        WHERE t.match_id = $1
          AND t.status IN ('paid', 'checked_in')
        GROUP BY EXTRACT(HOUR FROM t.created_at)
        ORDER BY hour
      `, [matchId])
    ]);

    return {
      match,
      byStand: byStand.rows,
      checkinStats: checkinStats.rows[0],
      peakHours: peakHours.rows
    };
  }
};
