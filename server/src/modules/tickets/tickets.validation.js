import { body } from "express-validator";
import { MAX_SEATS_PER_ORDER } from "../../constants/ticketRules.js";

export const bookTicketsRules = [
  body("matchId")
    .notEmpty().withMessage("matchId is required.")
    .isInt({ min: 1 }).withMessage("matchId must be a positive integer."),
  
  // Validate selections if present
  body("selections")
    .optional()
    .isArray({ min: 1, max: 2 }).withMessage("You can select up to 2 seating areas."),
  body("selections.*.standId")
    .optional()
    .isInt({ min: 1 }).withMessage("standId must be a positive integer."),
  body("selections.*.quantity")
    .optional()
    .isInt({ min: 1, max: MAX_SEATS_PER_ORDER })
    .withMessage(`Quantity must be between 1 and ${MAX_SEATS_PER_ORDER}.`),

  // Legacy fields (made optional if selections exist)
  body("standId")
    .if(body("selections").not().exists())
    .notEmpty().withMessage("standId is required.")
    .isInt({ min: 1 }).withMessage("standId must be a positive integer."),
  body("quantity")
    .if(body("selections").not().exists())
    .notEmpty().withMessage("quantity is required.")
    .isInt({ min: 1, max: MAX_SEATS_PER_ORDER })
    .withMessage(`Quantity must be between 1 and ${MAX_SEATS_PER_ORDER}.`)
];
