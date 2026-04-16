import { body } from "express-validator";

export const registerRules = [
  body("email")
    .isEmail().withMessage("Email không hợp lệ.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Mật khẩu phải từ 6 ký tự trở lên.")
    .isLength({ max: 100 }).withMessage("Mật khẩu tối đa 100 ký tự."),
  body("fullName")
    .trim()
    .notEmpty().withMessage("Họ tên là bắt buộc.")
    .isLength({ max: 255 }).withMessage("Họ tên tối đa 255 ký tự."),
  body("phone")
    .optional()
    .isMobilePhone("vi-VN").withMessage("Số điện thoại không hợp lệ.")
];

export const loginRules = [
  body("email")
    .isEmail().withMessage("Email không hợp lệ.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Mật khẩu là bắt buộc.")
];

export const onboardingRules = [
  body("primarySportId")
    .optional()
    .isInt({ min: 1 }).withMessage("primarySportId phải là số nguyên dương."),
  body("secondarySportId")
    .optional()
    .isInt({ min: 1 }).withMessage("secondarySportId phải là số nguyên dương.")
];
