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
    .notEmpty().withMessage("Please assign a club for Manager role.")
    .isInt({ min: 1 }).withMessage("clubId must be a positive integer.")
];

export const updateUserRules = [
  commonUserValidators.email(),
  commonUserValidators.fullName(),
  body("role")
    .isIn(ALLOWED_ROLES).withMessage(`Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`),
  body("clubId")
    .if(body("role").equals(ROLES.MANAGER))
    .notEmpty().withMessage("Please assign a club for Manager role.")
    .isInt({ min: 1 }).withMessage("clubId must be a positive integer.")
];
