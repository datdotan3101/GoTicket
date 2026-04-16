import { validationResult } from "express-validator";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

/**
 * Generic validation runner.
 * Nhận một mảng ValidationChain từ express-validator,
 * chạy tất cả và trả về lỗi nếu có.
 *
 * @example
 * import { body } from "express-validator";
 * import { runValidation } from "../middlewares/validate.js";
 *
 * router.post("/", runValidation([
 *   body("email").isEmail(),
 *   body("password").isLength({ min: 6 })
 * ]), createHandler);
 */
export const runValidation = (rules) => async (req, res, next) => {
  // Chạy tất cả validation rules
  for (const rule of rules) {
    await rule.run(req);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return sendError(res, messages.join("; "), HTTP_STATUS.BAD_REQUEST);
  }

  return next();
};
