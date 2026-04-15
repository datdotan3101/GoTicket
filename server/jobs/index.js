import { startMatchReminderJob } from "./matchReminder.job.js";
import { startScheduledPublishJob } from "./scheduledPublish.job.js";

export const startJobs = () => {
  startScheduledPublishJob();
  startMatchReminderJob();
};
