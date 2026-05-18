import { body } from "express-validator";

export const commonUserValidators = {
  email: () => 
    body("email")
      .isEmail().withMessage("Invalid email format.")
      .normalizeEmail(),

  password: (fieldName = "password") => 
    body(fieldName)
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
      .isLength({ max: 100 }).withMessage("Password exceeds 100 characters.")
      .matches(/[a-zA-Z]/).withMessage("Password must contain at least one letter.")
      .matches(/\d/).withMessage("Password must contain at least one number.")
      .matches(/[!@#$%^&*(),.?":{}|<>_]/).withMessage("Password must contain at least one special character."),

  fullName: () => 
    body("fullName")
      .trim()
      .notEmpty().withMessage("Full Name is required.")
      .isLength({ max: 255 }).withMessage("Full Name exceeds 255 characters.")
};
