require('dotenv').config();
const { query } = require('./src/config/db.js');

query("SELECT id, home_team, away_team, match_date, status, ticket_sale_open_at FROM matches").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
