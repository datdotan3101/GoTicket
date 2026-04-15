import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createPaymentIntent, stripeWebhook } from "./payments.controller.js";

const router = Router();

router.post("/create-intent", auth, requireRoles(ROLES.AUDIENCE), createPaymentIntent);
router.post("/webhook", stripeWebhook);

export default router;
