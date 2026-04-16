import cron from "node-cron";
import { query } from "../src/config/db.js";
import { emitToMatch } from "../src/config/socket.js";
import { logger } from "../src/utils/logger.js";

const publishMatches = async () => {
  const result = await query(
    `UPDATE matches
     SET status = 'published', published_at = NOW()
     WHERE status = 'approved'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()
     RETURNING id, home_team, away_team`
  );
  if (result.rowCount > 0) {
    logger.info(`[scheduledPublish] Published ${result.rowCount} match(es).`);
    // Emit ticket:sale:open cho các trận vừa được publish
    for (const match of result.rows) {
      emitToMatch(match.id, "ticket:sale:open", {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team
      });
    }
  }
  return result.rowCount;
};

const publishNews = async () => {
  const result = await query(
    `UPDATE news
     SET status = 'published', published_at = NOW()
     WHERE status = 'approved'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()
     RETURNING id, title`
  );
  if (result.rowCount > 0) {
    logger.info(`[scheduledPublish] Published ${result.rowCount} news article(s).`);
  }
  return result.rowCount;
};

export const startScheduledPublishJob = () => {
  return cron.schedule("* * * * *", async () => {
    try {
      await publishMatches();
      await publishNews();
    } catch (error) {
      logger.error(`[scheduledPublish] Job failed: ${error.message}`);
    }
  });
};
