import "dotenv/config";
import { db } from "../../src/config/db.js";
import bcrypt from "bcryptjs";

/**
 * Seed: Demo data đầy đủ cho development/testing.
 * Tạo: stadium, club, league, manager user, 1 match approved + seats.
 * Chạy: node database/seeds/seed_demo_match.js
 *
 * Requires: seed_admin.js và seed_sports.js đã chạy trước.
 */
const seedDemoMatch = async () => {
  console.log("🌱 Seeding demo match data...");

  // Lấy sport bóng đá
  const sportResult = await db.query("SELECT id FROM sports WHERE slug = 'bong-da' LIMIT 1");
  if (sportResult.rowCount === 0) {
    throw new Error("Sport 'bong-da' không tồn tại. Hãy chạy seed_sports.js trước.");
  }
  const sportId = sportResult.rows[0].id;

  // Admin user để làm submitted_by
  const adminResult = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (adminResult.rowCount === 0) {
    throw new Error("Admin user không tồn tại. Hãy chạy seed_admin.js trước.");
  }
  const adminId = adminResult.rows[0].id;

  // 1. Tạo Stadium
  const stadiumResult = await db.query(
    `INSERT INTO stadiums (name, city, address, image_url)
     VALUES ('Sân vận động Mỹ Đình', 'Hà Nội', 'Mễ Trì, Nam Từ Liêm, Hà Nội', null)
     ON CONFLICT DO NOTHING
     RETURNING id, name`
  );
  const stadiumId = stadiumResult.rowCount > 0
    ? stadiumResult.rows[0].id
    : (await db.query("SELECT id FROM stadiums WHERE name = 'Sân vận động Mỹ Đình' LIMIT 1")).rows[0]?.id;

  if (!stadiumId) throw new Error("Không thể tạo stadium.");
  console.log(`✅ Stadium: Sân vận động Mỹ Đình (id=${stadiumId})`);

  // 2. Tạo Club
  const clubResult = await db.query(
    `INSERT INTO clubs (name, logo_url, sport_id)
     VALUES ('Câu lạc bộ Hà Nội FC', null, $1)
     ON CONFLICT DO NOTHING
     RETURNING id, name`,
    [sportId]
  );
  const clubId = clubResult.rowCount > 0
    ? clubResult.rows[0].id
    : (await db.query("SELECT id FROM clubs WHERE name = 'Câu lạc bộ Hà Nội FC' LIMIT 1")).rows[0]?.id;

  if (!clubId) throw new Error("Không thể tạo club.");
  console.log(`✅ Club: Hà Nội FC (id=${clubId})`);

  // 3. Tạo League
  const leagueResult = await db.query(
    `INSERT INTO leagues (name, sport_id, season, is_active, created_by)
     VALUES ('V.League 1', $1, '2024-2025', true, $2)
     ON CONFLICT DO NOTHING
     RETURNING id, name`,
    [sportId, adminId]
  );
  const leagueId = leagueResult.rowCount > 0
    ? leagueResult.rows[0].id
    : (await db.query("SELECT id FROM leagues WHERE name = 'V.League 1' LIMIT 1")).rows[0]?.id;

  if (!leagueId) throw new Error("Không thể tạo league.");
  console.log(`✅ League: V.League 1 (id=${leagueId})`);

  // 4. Tạo Manager user
  const managerEmail = "manager@goticket.vn";
  let managerId;
  const managerExist = await db.query("SELECT id FROM users WHERE email = $1", [managerEmail]);
  if (managerExist.rowCount === 0) {
    const hash = await bcrypt.hash("Manager@123456", 12);
    const mgr = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, club_id, is_active, is_approved)
       VALUES ($1, $2, 'Demo Manager', 'manager', $3, true, true)
       RETURNING id, email`,
      [managerEmail, hash, clubId]
    );
    managerId = mgr.rows[0].id;
    console.log(`✅ Manager: ${managerEmail} (id=${managerId}) / password: Manager@123456`);
  } else {
    managerId = managerExist.rows[0].id;
    console.log(`⚠️  Manager already exists: ${managerEmail} (id=${managerId})`);
  }

  // 5. Tạo Match (status=published, ngày trong tương lai 7 ngày)
  const matchDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const existingMatch = await db.query(
    "SELECT id FROM matches WHERE home_team = 'Hà Nội FC' AND away_team = 'HAGL' LIMIT 1"
  );

  if (existingMatch.rowCount > 0) {
    console.log(`⚠️  Demo match already exists (id=${existingMatch.rows[0].id})`);
    return;
  }

  const matchResult = await db.query(
    `INSERT INTO matches
       (home_team, away_team, match_date, stadium_id, league_id, club_id,
        status, published_at, ticket_sale_open_at, description, created_by)
     VALUES
       ('Hà Nội FC', 'HAGL', $1, $2, $3, $4,
        'published', NOW(), NOW(), 'Trận derby hấp dẫn tại Mỹ Đình', $5)
     RETURNING id`,
    [matchDate, stadiumId, leagueId, clubId, managerId]
  );
  const matchId = matchResult.rows[0].id;
  console.log(`✅ Match: Hà Nội FC vs HAGL (id=${matchId})`);

  // 6. Tạo stands & seats (4 khán đài, 200 chỗ)
  const STANDS = [
    { name: "A", rows: 5, seatsPerRow: 25, price: 300000 },
    { name: "B", rows: 5, seatsPerRow: 25, price: 200000 },
    { name: "C", rows: 4, seatsPerRow: 25, price: 150000 },
    { name: "D", rows: 4, seatsPerRow: 25, price: 100000 }
  ];

  for (const stand of STANDS) {
    const total = stand.rows * stand.seatsPerRow;
    const standResult = await db.query(
      `INSERT INTO stands (match_id, stadium_id, name, rows, seats_per_row, total_seats, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [matchId, stadiumId, stand.name, stand.rows, stand.seatsPerRow, total, stand.price]
    );
    if (standResult.rowCount === 0) continue;

    const standId = standResult.rows[0].id;
    const seatValues = [];
    const placeholders = [];
    let idx = 1;

    for (let r = 1; r <= stand.rows; r++) {
      for (let s = 1; s <= stand.seatsPerRow; s++) {
        seatValues.push(standId, matchId, r, s, `${stand.name}-${r}-${s}`);
        placeholders.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4})`);
        idx += 5;
      }
    }

    await db.query(
      `INSERT INTO seats (stand_id, match_id, row_number, seat_number, seat_label)
       VALUES ${placeholders.join(",")}
       ON CONFLICT DO NOTHING`,
      seatValues
    );
    console.log(`✅ Stand ${stand.name}: ${total} seats created`);
  }

  console.log("\n🎉 Demo data seeded successfully!");
  console.log(`   Match ID: ${matchId}`);
  console.log(`   Truy cập: GET /api/matches/${matchId}`);
};

seedDemoMatch()
  .then(() => db.end())
  .catch((err) => {
    console.error("❌ Seed failed:", err.message);
    db.end();
    process.exit(1);
  });
