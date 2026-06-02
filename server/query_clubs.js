import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:12345678@localhost:5432/goticket' });
pool.query('SELECT name, logo_url FROM clubs').then(res => {
  console.log(res.rows);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
