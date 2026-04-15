import cron from "node-cron";
import { query } from "../src/config/db.js";

const publishMatches = async () => {
  await query(
    `UPDATE matches
     SET status = 'published', published_at = NOW()
     WHERE status = 'approved'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()`
  );
};

const publishNews = async () => {
  await query(
    `UPDATE news
     SET status = 'published', published_at = NOW()
     WHERE status = 'approved'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()`
  );
};

export const startScheduledPublishJob = () => {
  return cron.schedule("* * * * *", async () => {
    try {
      await publishMatches();
      await publishNews();
    } catch (error) {
      // Keep scheduler alive even if schema/data is not ready.
      console.error("scheduledPublish.job failed:", error.message);
    }
  });
};
