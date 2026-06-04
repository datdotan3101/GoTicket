import { createCrudController } from "../../utils/controllerFactory.js";
import { clubsService } from "./clubs.service.js";

/** CRUD endpoints for Clubs */
export const { getAll, getById, create, update, remove } = createCrudController(clubsService, "Club");
