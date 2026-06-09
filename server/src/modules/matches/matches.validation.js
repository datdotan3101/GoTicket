import { body } from "express-validator";


export const createMatchRules = [
  body("homeTeam")
    .trim()
    .notEmpty().withMessage("homeTeam is required.")
    .isLength({ max: 120 }).withMessage("homeTeam must be at most 120 characters."),
  body("awayTeam")
    .trim()
    .notEmpty().withMessage("awayTeam is required.")
    .isLength({ max: 120 }).withMessage("awayTeam must be at most 120 characters.")
    .custom((value, { req }) => {
      if (value.toLowerCase() === req.body.homeTeam?.toLowerCase()) {
        throw new Error("homeTeam and awayTeam must not be the same.");
      }
      return true;
    }),
  body("matchDate")
    .notEmpty().withMessage("matchDate is required.")
    .isISO8601().withMessage("matchDate must be an ISO8601 datetime.")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("matchDate must be a future date and time.");
      }
      return true;
    }),
  body("stadiumId")
    .notEmpty().withMessage("stadiumId is required.")
    .isInt({ min: 1 }).withMessage("stadiumId must be a positive integer."),
  body("leagueId")
    .notEmpty().withMessage("leagueId is required.")
    .isInt({ min: 1 }).withMessage("leagueId must be a positive integer."),
  body("ticketSaleOpenAt")
    .optional()
    .isISO8601().withMessage("ticketSaleOpenAt must be an ISO8601 datetime.")
    .custom((value, { req }) => {
      if (value && req.body.matchDate) {
        if (new Date(value) >= new Date(req.body.matchDate)) {
          throw new Error("ticketSaleOpenAt must be before the match date.");
        }
      }
      return true;
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("description must be at most 2000 characters."),
  body("thumbnailUrl")
    .optional()
    .isString().withMessage("thumbnailUrl must be a string.")
];

export const updateMatchRules = [
  body("homeTeam")
    .optional()
    .trim()
    .notEmpty().withMessage("homeTeam cannot be empty if provided.")
    .isLength({ max: 120 }).withMessage("homeTeam must be at most 120 characters."),
  body("awayTeam")
    .optional()
    .trim()
    .notEmpty().withMessage("awayTeam cannot be empty if provided.")
    .isLength({ max: 120 }).withMessage("awayTeam must be at most 120 characters.")
    .custom((value, { req }) => {
      if (req.body.homeTeam && value.toLowerCase() === req.body.homeTeam.toLowerCase()) {
        throw new Error("homeTeam and awayTeam must not be the same.");
      }
      return true;
    }),
  body("matchDate")
    .optional()
    .notEmpty().withMessage("matchDate cannot be empty if provided.")
    .isISO8601().withMessage("matchDate must be an ISO8601 datetime.")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("matchDate must be a future date and time.");
      }
      return true;
    }),
  body("stadiumId")
    .optional()
    .notEmpty().withMessage("stadiumId cannot be empty if provided.")
    .isInt({ min: 1 }).withMessage("stadiumId must be a positive integer."),
  body("ticketSaleOpenAt")
    .optional({ nullable: true })
    .isISO8601().withMessage("ticketSaleOpenAt must be an ISO8601 datetime.")
    .custom((value, { req }) => {
      if (value && req.body.matchDate) {
        if (new Date(value) >= new Date(req.body.matchDate)) {
          throw new Error("ticketSaleOpenAt must be before the match date.");
        }
      }
      return true;
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("description must be at most 2000 characters.")
];

export const configStandsRules = [
  body("totalCapacity")
    .notEmpty().withMessage("totalCapacity is required.")
    .isInt({ min: 100, max: 1000000 }).withMessage("Total seats must be between 100 and 1,000,000."),
  body("blockConfigs")
    .notEmpty().withMessage("Stand configuration (blockConfigs) is required.")
    .isObject().withMessage("blockConfigs must be an object."),
];
