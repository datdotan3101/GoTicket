import { body } from "express-validator";
import { MAX_SEATS_PER_ORDER } from "../../constants/ticketRules.js";

export const bookTicketsRules = [
  body("matchId")
    .notEmpty().withMessage("matchId là bắt buộc.")
    .isInt({ min: 1 }).withMessage("matchId phải là số nguyên dương."),
  body("seatIds")
    .isArray({ min: 1, max: MAX_SEATS_PER_ORDER })
    .withMessage(`Phải chọn từ 1 đến ${MAX_SEATS_PER_ORDER} ghế.`),
  body("seatIds.*")
    .isInt({ min: 1 }).withMessage("Mỗi seatId phải là số nguyên dương.")
];
