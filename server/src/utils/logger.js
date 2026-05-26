/**
 * Simple logger with timestamp — avoid scattering magic console.log calls.
 * Production: can be swapped with winston/pino without changing code.
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
