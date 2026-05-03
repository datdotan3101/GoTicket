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
      const statuses = filters.status.split(",");
      if (statuses.length === 1) {
        values.push(statuses[0]);
        where.push(`m.status = $${values.length}`);
      } else {
        const placeholders = statuses.map((_, i) => `$${values.length + i + 1}`);
        values.push(...statuses);
        where.push(`m.status IN (${placeholders.join(", ")})`);
      }
    }
    if (filters.league_id) {
      values.push(filters.league_id);
      where.push(`m.league_id = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const totalResult = await query(`SELECT COUNT(*)::int AS total FROM matches m ${whereClause}`, values);
    values.push(limit, offset);
    const result = await query(
      `SELECT m.*, s.name AS stadium_name, s.address AS stadium_address, l.name AS league_name,
              (SELECT MIN(price) FROM stands st WHERE st.match_id = m.id) AS min_price,
              (SELECT MAX(price) FROM stands st WHERE st.match_id = m.id) AS max_price,
              (SELECT COUNT(*)::int FROM tickets t WHERE t.match_id = m.id AND t.status IN ('paid', 'checked_in')) AS sold_count,
              (SELECT COALESCE(SUM(total_seats), 0)::int FROM stands st WHERE st.match_id = m.id) AS total_seats
       FROM matches m
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN leagues l ON l.id = m.league_id
       ${whereClause}
       ORDER BY m.match_date ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return buildPaginatedResponse(result.rows, totalResult.rows[0].total, page, limit);
  },

  async getById(id) {
    const result = await query(
      `SELECT m.*, s.name AS stadium_name, s.address AS stadium_address, l.name AS league_name,
              (SELECT COUNT(*)::int FROM tickets t WHERE t.match_id = m.id AND t.status IN ('paid', 'checked_in')) AS sold_count,
              (SELECT COALESCE(SUM(total_seats), 0)::int FROM stands st WHERE st.match_id = m.id) AS total_seats
       FROM matches m
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN leagues l ON l.id = m.league_id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(payload, user) {
    const result = await query(
      `INSERT INTO matches (home_team, away_team, match_date, stadium_id, league_id, club_id, status, ticket_sale_open_at, description, created_by, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $10)
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
        user.id,
        payload.thumbnailUrl || null
      ]
    );
    return result.rows[0];
  },

  async update(id, payload, user) {
    const match = await this.getById(id);
    if (!match) {
      throw new Error("Không tìm thấy trận đấu.");
    }
    if (!canAccessMatchByClub(user, match)) {
      throw new Error("Bạn không có quyền chỉnh sửa trận đấu của CLB khác.");
    }

    const result = await query(
      `UPDATE matches
       SET home_team = COALESCE($2, home_team),
           away_team = COALESCE($3, away_team),
           match_date = COALESCE($4, match_date),
           stadium_id = COALESCE($5, stadium_id),
           ticket_sale_open_at = COALESCE($6, ticket_sale_open_at),
           description = COALESCE($7, description),
           thumbnail_url = COALESCE($8, thumbnail_url)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        payload.homeTeam || null,
        payload.awayTeam || null,
        payload.matchDate || null,
        payload.stadiumId || null,
        payload.ticketSaleOpenAt || null,
        payload.description || null,
        payload.thumbnailUrl || null
      ]
    );
    return result.rows[0];
  },

  async delete(id, user) {
    const match = await this.getById(id);
    if (!match) throw new Error("Không tìm thấy trận đấu.");
    if (!canAccessMatchByClub(user, match)) throw new Error("Bạn không có quyền xóa trận đấu này.");
    if (match.status !== "draft") throw new Error("Chỉ có thể xóa trận đấu ở trạng thái draft.");
    await query("DELETE FROM seats WHERE match_id = $1", [id]);
    await query("DELETE FROM stands WHERE match_id = $1", [id]);
    await query("DELETE FROM matches WHERE id = $1", [id]);
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
    return withTransaction(async (tx) => {
      await tx.query(`UPDATE matches SET status = 'pending_review' WHERE id = $1`, [id]);
      await tx.query(
        `INSERT INTO approvals (resource_type, resource_id, submitted_by, status)
         VALUES ('match', $1, $2, 'pending')`,
        [id, userId]
      );
      return { id, status: "pending_review" };
    });
  },

  async configureStands(matchId, payload, user) {
    const match = await this.getById(matchId);
    if (!match) {
      throw new Error("Không tìm thấy trận đấu.");
    }
    if (!canAccessMatchByClub(user, match)) {
      throw new Error("Bạn không có quyền thao tác trận đấu của CLB khác.");
    }

    const stands = generateStands(payload.blockConfigs || {});
    return withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      await run("DELETE FROM seats WHERE match_id = $1", [matchId]);
      await run("DELETE FROM stands WHERE match_id = $1", [matchId]);

      for (const stand of stands) {
        const standResult = await run(
          `INSERT INTO stands (match_id, stadium_id, name, rows, seats_per_row, total_seats, price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [matchId, match.stadium_id, stand.name, stand.rows, stand.seatsPerRow, stand.totalSeats, stand.price]
        );
        const standId = standResult.rows[0].id;

        const PARAMS_PER_SEAT = 6;
        const BATCH_SIZE = Math.floor(60000 / PARAMS_PER_SEAT); // ~10000 seats per batch, safe limit

        const seatValues = [];
        let generatedCount = 0;
        for (let row = 1; row <= stand.rows && generatedCount < stand.totalSeats; row += 1) {
          for (let seat = 1; seat <= stand.seatsPerRow && generatedCount < stand.totalSeats; seat += 1) {
            seatValues.push([standId, matchId, row, seat, `${stand.name}-${row}-${seat}`, 'available']);
            generatedCount += 1;
          }
        }

        // Insert seats in batches to avoid PostgreSQL's 65535 parameter limit
        for (let i = 0; i < seatValues.length; i += BATCH_SIZE) {
          const batch = seatValues.slice(i, i + BATCH_SIZE);
          const flatValues = [];
          const placeholders = [];
          let index = 1;
          for (const seatRow of batch) {
            flatValues.push(...seatRow);
            placeholders.push(`($${index}, $${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${index + 5})`);
            index += 6;
          }
          await run(
            `INSERT INTO seats (stand_id, match_id, row_number, seat_number, seat_label, status)
             VALUES ${placeholders.join(", ")}`,
            flatValues
          );
        }
      }
      return stands;
    });
  },

  async getAvailabilityByMatchId(matchId) {
    const result = await query(
      `SELECT st.id, st.name, st.price, st.total_seats,
              COUNT(s.id) FILTER (WHERE s.status = 'available')::int AS available_seats
       FROM stands st
       LEFT JOIN seats s ON s.stand_id = st.id
       WHERE st.match_id = $1
       GROUP BY st.id, st.name, st.price, st.total_seats
       ORDER BY st.name`,
      [matchId]
    );
    return result.rows;
  }
};
