import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/response.js";
import authRoutes from "./modules/auth/auth.routes.js";
import sportsRoutes from "./modules/sports/sports.routes.js";
import matchesRoutes from "./modules/matches/matches.routes.js";
import ticketsRoutes from "./modules/tickets/tickets.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import checkinRoutes from "./modules/checkin/checkin.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import approvalsRoutes from "./modules/approvals/approvals.routes.js";
import clubsRoutes from "./modules/clubs/clubs.routes.js";
import leaguesRoutes from "./modules/leagues/leagues.routes.js";
import stadiumsRoutes from "./modules/stadiums/stadiums.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import newsRoutes from "./modules/news/news.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true
  })
);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     security: []
 */
app.get("/api/health", (req, res) => sendSuccess(res, { status: "ok" }));

if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use("/api/auth", authRoutes);
app.use("/api/sports", sportsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/clubs", clubsRoutes);
app.use("/api/leagues", leaguesRoutes);
app.use("/api/stadiums", stadiumsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/approvals", approvalsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
