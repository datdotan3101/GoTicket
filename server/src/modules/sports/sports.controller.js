import { createCrudController } from "../../utils/controllerFactory.js";
import { sportsService } from "./sports.service.js";

/** CRUD endpoints for Sports */
export const { getAll, create, update, remove } = createCrudController(sportsService, "Sport");
