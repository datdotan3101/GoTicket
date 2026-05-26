import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { query } from './src/config/db.js';

async function updateNotifications() {
  try {
    await query(`
      UPDATE notifications 
      SET 
        title = REPLACE(title, 'Trận đấu của bạn đã được duyệt', 'Your match has been approved'),
        title = REPLACE(title, 'Trận đấu của bạn bị từ chối ', 'Your match has been rejected '),
        body = REPLACE(body, 'Yêu cầu đã được duyệt và đã được đăng.', 'Your request has been approved and published.'),
        body = REPLACE(body, 'Yêu cầu bị từ chối.', 'Your request was rejected.')
    `);
    console.log('Successfully updated notifications to English.');
  } catch (err) {
    console.error('Error updating notifications:', err);
  } finally {
    process.exit(0);
  }
}

updateNotifications();
