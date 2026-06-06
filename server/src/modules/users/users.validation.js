import { body } from "express-validator";
import { ROLES } from "../../constants/roles.js";
import { commonUserValidators } from "../../middlewares/commonValidators.js";

const ALLOWED_ROLES = Object.values(ROLES);

export const createUserRules = [
  commonUserValidators.email(),
  commonUserValidators.password(),
  commonUserValidators.fullName(),
  body("role")
    .isIn(ALLOWED_ROLES).withMessage(`Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`),
  body("clubId")
    .if(body("role").equals(ROLES.MANAGER))
    .notEmpty().withMessage("Please select a club.").bail()
    .isInt({ min: 1 }).withMessage("Invalid club selection.")
];

export const updateUserRules = [
  commonUserValidators.email(),
  commonUserValidators.fullName(),
  body("role")
    .isIn(ALLOWED_ROLES).withMessage(`Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`),
  body("clubId")
    .if(body("role").equals(ROLES.MANAGER))
    .notEmpty().withMessage("Please select a club.").bail()
    .isInt({ min: 1 }).withMessage("Invalid club selection.")
];
