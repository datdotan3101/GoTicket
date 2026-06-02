import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:12345678@localhost:5432/goticket' });
pool.query(`
SELECT m.home_team, m.away_team, 
       hc.logo_url AS home_team_logo, 
       ac.logo_url AS away_team_logo
FROM matches m
LEFT JOIN clubs hc ON hc.name = m.home_team
LEFT JOIN clubs ac ON ac.name = m.away_team
`).then(res => {
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
