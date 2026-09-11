import pg from 'pg';
import "dotenv/config";

const localPool = new pg.Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/goticket'
});

const remotePool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const tables = [
  'sports', 'users', 'stadiums', 'leagues', 'clubs', 'matches', 'stands', 'seats', 'news', 'tickets', 'payments', 'notifications', 'approvals', 'password_resets', 'messages'
];

async function syncDb() {
  console.log('Starting fast data synchronization from Local to Supabase...');

  const remoteClient = await remotePool.connect();
  const localClient = await localPool.connect();

  try {
    // Disable foreign key checks for this session
    await remoteClient.query("SET session_replication_role = 'replica';");
    console.log('Foreign key checks disabled for session.');

    console.log('Cleaning up existing data on Supabase...');
    for (const table of tables) {
      try {
        await remoteClient.query(`DELETE FROM ${table}`);
      } catch (e) {
        // ignore if table doesn't exist
      }
    }

    console.log('\nCopying data in batches...');
    for (const table of tables) {
      try {
        const localData = await localClient.query(`SELECT * FROM ${table}`);
        const rows = localData.rows;
        
        if (rows.length === 0) {
          console.log(`- ${table}: 0 rows`);
          continue;
        }

        const columns = Object.keys(rows[0]);
        const chunkSize = 500;
        let insertCount = 0;

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          
          let valuesArr = [];
          let paramIndex = 1;
          let flatValues = [];
          
          for (const row of chunk) {
            let rowParams = [];
            for (const col of columns) {
              rowParams.push(`$${paramIndex++}`);
              flatValues.push(row[col]);
            }
            valuesArr.push(`(${rowParams.join(', ')})`);
          }

          const query = `INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${valuesArr.join(', ')}`;
          await remoteClient.query(query, flatValues);
          insertCount += chunk.length;
        }
        
        console.log(`- ${table}: Copied ${insertCount} rows`);
      } catch (err) {
        console.error(`- Error copying ${table}:`, err.message);
      }
    }

    // Re-enable foreign key checks
    await remoteClient.query("SET session_replication_role = 'origin';");
    console.log('\nForeign key checks re-enabled.');
    console.log('Data synchronization completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    remoteClient.release();
    localClient.release();
    await localPool.end();
    await remotePool.end();
  }
}

syncDb();
