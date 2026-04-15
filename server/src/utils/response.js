export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (res, message, statusCode = 500, details = null) => {
  const payload = { success: false, message };
  if (details) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};
