import { body } from "express-validator";

export const commonUserValidators = {
  email: () => 
    body("email")
      .isEmail().withMessage("Invalid email format.")
      .normalizeEmail(),

  password: (fieldName = "password") => 
    body(fieldName)
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
      .isLength({ max: 100 }).withMessage("Password exceeds 100 characters."),

  fullName: () => 
    body("fullName")
      .trim()
      .notEmpty().withMessage("Full Name is required.")
      .isLength({ max: 255 }).withMessage("Full Name exceeds 255 characters.")
};
