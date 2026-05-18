import { body } from "express-validator";
import { commonUserValidators } from "../../middlewares/commonValidators.js";

export const registerRules = [
  commonUserValidators.email(),
  commonUserValidators.password(),
  commonUserValidators.fullName(),
  body("phone")
    .optional()
    .isMobilePhone("vi-VN").withMessage("Invalid phone number format.")
];

export const loginRules = [
  commonUserValidators.email(),
  body("password")
    .notEmpty().withMessage("Password is required.")
];

export const onboardingRules = [
  body("primarySportId")
    .optional()
    .isInt({ min: 1 }).withMessage("primarySportId must be a positive integer."),
  body("secondarySportId")
    .optional()
    .isInt({ min: 1 }).withMessage("secondarySportId must be a positive integer.")
];

export const changePasswordRules = [
  commonUserValidators.password("newPassword")
];
