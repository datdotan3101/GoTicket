import { body } from "express-validator";
import { MAX_SEATS_PER_ORDER } from "../../constants/ticketRules.js";

export const bookTicketsRules = [
  body("matchId")
    .notEmpty().withMessage("matchId là bắt buộc.")
    .isInt({ min: 1 }).withMessage("matchId phải là số nguyên dương."),
  body("standId")
    .notEmpty().withMessage("standId là bắt buộc.")
    .isInt({ min: 1 }).withMessage("standId phải là số nguyên dương."),
  body("quantity")
    .notEmpty().withMessage("quantity là bắt buộc.")
    .isInt({ min: 1, max: MAX_SEATS_PER_ORDER })
    .withMessage(`Số lượng vé phải từ 1 đến ${MAX_SEATS_PER_ORDER}.`)
];
