import { body } from "express-validator";

export const createNewsRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Tiêu đề là bắt buộc.")
    .isLength({ max: 255 }).withMessage("Tiêu đề tối đa 255 ký tự."),
  body("content")
    .notEmpty().withMessage("Nội dung là bắt buộc."),
  body("sportId")
    .optional()
    .isInt({ min: 1 }).withMessage("sportId phải là số nguyên dương."),
  body("thumbnailUrl")
    .optional()
    .isURL().withMessage("thumbnailUrl phải là URL hợp lệ."),
  body("scheduledPublishAt")
    .optional()
    .isISO8601().withMessage("scheduledPublishAt phải là datetime ISO8601.")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Thời gian lên lịch phải là tương lai.");
      }
      return true;
    })
];

export const updateNewsRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("Tiêu đề không được để trống.")
    .isLength({ max: 255 }).withMessage("Tiêu đề tối đa 255 ký tự."),
  body("sportId")
    .optional()
    .isInt({ min: 1 }).withMessage("sportId phải là số nguyên dương."),
  body("thumbnailUrl")
    .optional()
    .isURL().withMessage("thumbnailUrl phải là URL hợp lệ."),
  body("scheduledPublishAt")
    .optional()
    .isISO8601().withMessage("scheduledPublishAt phải là datetime ISO8601.")
];
