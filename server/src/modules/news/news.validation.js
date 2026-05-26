import { body } from "express-validator";

export const createNewsRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required.")
    .isLength({ max: 255 }).withMessage("Title must be at most 255 characters."),
  body("content")
    .notEmpty().withMessage("Content is required."),
  body("sportId")
    .optional()
    .isInt({ min: 1 }).withMessage("sportId must be a positive integer."),
  body("thumbnailUrl")
    .optional()
    .isURL().withMessage("thumbnailUrl must be a valid URL."),
  body("scheduledPublishAt")
    .optional()
    .isISO8601().withMessage("scheduledPublishAt must be an ISO8601 datetime.")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Scheduled publish time must be in the future.");
      }
      return true;
    })
];

export const updateNewsRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("Title cannot be empty.")
    .isLength({ max: 255 }).withMessage("Title must be at most 255 characters."),
  body("sportId")
    .optional()
    .isInt({ min: 1 }).withMessage("sportId must be a positive integer."),
  body("thumbnailUrl")
    .optional()
    .isURL().withMessage("thumbnailUrl must be a valid URL."),
  body("scheduledPublishAt")
    .optional()
    .isISO8601().withMessage("scheduledPublishAt must be an ISO8601 datetime.")
];
