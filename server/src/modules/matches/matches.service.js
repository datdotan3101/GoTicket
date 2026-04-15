import { query, withTransaction } from "../../config/db.js";
import { generateStands } from "../../utils/standGenerator.js";
import { getPagination, buildPaginatedResponse } from "../../utils/pagination.js";

const canAccessMatchByClub = (user, matchRow) => {
  if (user.role !== "manager") return true;
  return user.club_id && Number(user.club_id) === Number(matchRow.club_id);
};

export const matchesService = {
  async getAll(filters) {
    const { page, limit, offset } = getPagination(filters);
    const values = [];
    const where = [];

    if (filters.status) {
      values.push(filters.status);
      where.push(`m.status = $${values.length}`);
    }
    if (filters.league_id) {
      values.push(filters.league_id);
      where.push(`m.league_id = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const totalResult = await query(`SELECT COUNT(*)::int AS total FROM matches m ${whereClause}`, values);
    values.push(limit, offset);
    const result = await query(
      `SELECT m.* FROM matches m ${whereClause}
       ORDER BY m.match_date ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return buildPaginatedResponse(result.rows, totalResult.rows[0].total, page, limit);
  },

  async getById(id) {
    const result = await query("SELECT * FROM matches WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async create(payload, user) {
    const result = await query(
      `INSERT INTO matches (home_team, away_team, match_date, stadium_id, league_id, club_id, status, ticket_sale_open_at, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9)
       RETURNING *`,
      [
        payload.homeTeam,
        payload.awayTeam,
        payload.matchDate,
        payload.stadiumId,
        payload.leagueId,
        user.club_id,
        payload.ticketSaleOpenAt,
        payload.description || null,
        user.id
      ]
    );
    return result.rows[0];
  },

  async getSeatsByMatchId(matchId) {
    const result = await query(
      `SELECT s.id, s.stand_id, s.row_number, s.seat_number, s.seat_label, s.status, st.name AS stand_name, st.price
       FROM seats s
       JOIN stands st ON st.id = s.stand_id
       WHERE s.match_id = $1
       ORDER BY st.name, s.row_number, s.seat_number`,
      [matchId]
    );
    return result.rows;
  },

  async submitForApproval(id, userId) {
    await query(
      `UPDATE matches SET status = 'pending_review' WHERE id = $1;
       INSERT INTO approvals (resource_type, resource_id, submitted_by, status)
       VALUES ('match', $1, $2, 'pending')`,
      [id, userId]
    );
    return { id, status: "pending_review" };
  },

  async configureStands(matchId, payload, user) {
    const match = await this.getById(matchId);
    if (!match) {
      throw new Error("Không tìm thấy trận đấu.");
    }
    if (!canAccessMatchByClub(user, match)) {
      throw new Error("Bạn không có quyền thao tác trận đấu của CLB khác.");
    }

    const stands = generateStands(payload.totalCapacity, payload.prices);
    return withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      await run("DELETE FROM stands WHERE match_id = $1", [matchId]);

      for (const stand of stands) {
        const standResult = await run(
          `INSERT INTO stands (match_id, stadium_id, name, rows, seats_per_row, total_seats, price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [matchId, match.stadium_id, stand.name, stand.rows, stand.seatsPerRow, stand.totalSeats, stand.price]
        );
        const standId = standResult.rows[0].id;

        const seatValues = [];
        const placeholders = [];
        let index = 1;
        for (let row = 1; row <= stand.rows; row += 1) {
          for (let seat = 1; seat <= stand.seatsPerRow; seat += 1) {
            if (seatValues.length / 5 >= stand.totalSeats) break;
            seatValues.push(standId, matchId, row, seat, `${stand.name}-${row}-${seat}`);
            placeholders.push(`($${index}, $${index + 1}, $${index + 2}, $${index + 3}, $${index + 4})`);
            index += 5;
          }
        }
        if (seatValues.length > 0) {
          await run(
            `INSERT INTO seats (stand_id, match_id, row_number, seat_number, seat_label)
             VALUES ${placeholders.join(", ")}`,
            seatValues
          );
        }
      }
      return stands;
    });
  }
};
