import { body } from "express-validator";

export const rejectApprovalRules = [
  body("reason")
    .trim()
    .notEmpty().withMessage("Lý do từ chối là bắt buộc.")
    .isLength({ min: 10, max: 500 }).withMessage("Lý do phải từ 10 đến 500 ký tự.")
];
