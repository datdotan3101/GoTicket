import { body } from "express-validator";
import { TICKET_RULES } from "../../constants/ticketRules.js";

export const createMatchRules = [
  body("homeTeam")
    .trim()
    .notEmpty().withMessage("homeTeam là bắt buộc.")
    .isLength({ max: 120 }).withMessage("homeTeam tối đa 120 ký tự."),
  body("awayTeam")
    .trim()
    .notEmpty().withMessage("awayTeam là bắt buộc.")
    .isLength({ max: 120 }).withMessage("awayTeam tối đa 120 ký tự.")
    .custom((value, { req }) => {
      if (value.toLowerCase() === req.body.homeTeam?.toLowerCase()) {
        throw new Error("homeTeam và awayTeam không được trùng nhau.");
      }
      return true;
    }),
  body("matchDate")
    .notEmpty().withMessage("matchDate là bắt buộc.")
    .isISO8601().withMessage("matchDate phải là datetime ISO8601.")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("matchDate phải là thời gian tương lai.");
      }
      return true;
    }),
  body("stadiumId")
    .notEmpty().withMessage("stadiumId là bắt buộc.")
    .isInt({ min: 1 }).withMessage("stadiumId phải là số nguyên dương."),
  body("leagueId")
    .notEmpty().withMessage("leagueId là bắt buộc.")
    .isInt({ min: 1 }).withMessage("leagueId phải là số nguyên dương."),
  body("ticketSaleOpenAt")
    .optional()
    .isISO8601().withMessage("ticketSaleOpenAt phải là datetime ISO8601."),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("description tối đa 2000 ký tự.")
];

export const configStandsRules = [
  body("totalCapacity")
    .notEmpty().withMessage("totalCapacity là bắt buộc.")
    .isInt({ min: 100, max: 100000 }).withMessage("Tổng ghế phải từ 100 đến 100,000."),
  body("prices")
    .notEmpty().withMessage("prices là bắt buộc."),
  body("prices.A")
    .isFloat({ min: 0 }).withMessage("Giá khán đài A phải >= 0."),
  body("prices.B")
    .isFloat({ min: 0 }).withMessage("Giá khán đài B phải >= 0."),
  body("prices.C")
    .isFloat({ min: 0 }).withMessage("Giá khán đài C phải >= 0."),
  body("prices.D")
    .isFloat({ min: 0 }).withMessage("Giá khán đài D phải >= 0.")
];
