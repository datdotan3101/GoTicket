import pg from 'pg';

const client = new pg.Client({ 
  connectionString: 'postgresql://postgres.qhejzdxfalkbxttwsutr:Goticket%4012345678@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres' 
}); 

client.connect()
  .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
  .then(res => { 
    console.log('Tables:', res.rows.map(r => r.table_name)); 
    return client.query("SELECT count(*) FROM users");
  })
  .then(res => {
    console.log('Users count:', res.rows[0].count);
    return client.query("SELECT count(*) FROM clubs");
  })
  .then(res => {
    console.log('Clubs count:', res.rows[0].count);
    return client.end(); 
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
