import { createCrudController } from "../../utils/controllerFactory.js";
import { leaguesService } from "./leagues.service.js";

/** CRUD endpoints for Leagues */
export const { getAll, getById, create, update, remove } = createCrudController(leaguesService, "League", { createWithUser: true });
