import { body } from "express-validator";

export const rejectApprovalRules = [
  body("reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required.")
    .isLength({ min: 10, max: 500 }).withMessage("Reason must be between 10 and 500 characters.")
];
