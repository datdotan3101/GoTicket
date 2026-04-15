import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { bookTickets, myTickets } from "./tickets.controller.js";

const router = Router();

router.post("/book", auth, requireRoles(ROLES.AUDIENCE), bookTickets);
router.get("/my", auth, requireRoles(ROLES.AUDIENCE), myTickets);

export default router;
