import { createCrudController } from "../../utils/controllerFactory.js";
import { stadiumsService } from "./stadiums.service.js";

/** CRUD endpoints for Stadiums */
export const { getAll, getById, create, update, remove } = createCrudController(stadiumsService, "Stadium");
