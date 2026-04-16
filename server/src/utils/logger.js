/**
 * Logger đơn giản với timestamp — không dùng magic console.log rải rắc.
 * Production: có thể swap sang winston/pino mà không cần sửa code.
 */
const formatTimestamp = () => new Date().toISOString();

const formatMessage = (level, message) =>
  `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}`;

export const logger = {
  info: (message) => {
    console.log(formatMessage("info", message));
  },
  warn: (message) => {
    console.warn(formatMessage("warn", message));
  },
  error: (message, error) => {
    console.error(formatMessage("error", message));
    if (error) console.error(error);
  },
  debug: (message) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatMessage("debug", message));
    }
  }
};
