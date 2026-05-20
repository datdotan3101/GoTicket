import { startMatchReminderJob } from "./matchReminder.job.js";
import { startScheduledPublishJob } from "./scheduledPublish.job.js";
import { startCleanupExpiredTicketsJob } from "./cleanupExpiredTickets.job.js";

export const startJobs = () => {
  startScheduledPublishJob();
  startMatchReminderJob();
  startCleanupExpiredTicketsJob();
};
