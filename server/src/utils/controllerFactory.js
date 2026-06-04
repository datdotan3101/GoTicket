import { HTTP_STATUS } from "../constants/httpStatus.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "./response.js";

/**
 * Creates standard CRUD controllers to eliminate duplicate logic.
 * 
 * @param {Object} service - The service object (e.g., clubsService)
 * @param {String} entityName - Name of the entity for error messages (e.g., "Club")
 * @param {Object} options - Configuration options
 * @param {Boolean} options.createWithUser - If true, passes req.user.id as the second argument to service.create()
 * @returns {Object} An object containing the standard CRUD handlers
 */
export const createCrudController = (service, entityName, options = {}) => {
  return {
    getAll: asyncHandler(async (req, res) => {
      const data = await service.getAll(req.query);
      return sendSuccess(res, data);
    }),

    getById: asyncHandler(async (req, res) => {
      if (!service.getById) return sendError(res, "Endpoint not supported", HTTP_STATUS.NOT_FOUND);
      const data = await service.getById(Number(req.params.id));
      if (!data) return sendError(res, `${entityName} not found.`, HTTP_STATUS.NOT_FOUND);
      return sendSuccess(res, data);
    }),

    create: asyncHandler(async (req, res) => {
      const data = options.createWithUser
        ? await service.create(req.body, req.user.id)
        : await service.create(req.body);
      return sendSuccess(res, data, HTTP_STATUS.CREATED);
    }),

    update: asyncHandler(async (req, res) => {
      const data = await service.update(Number(req.params.id), req.body);
      if (!data) return sendError(res, `${entityName} not found.`, HTTP_STATUS.NOT_FOUND);
      return sendSuccess(res, data);
    }),

    remove: asyncHandler(async (req, res) => {
      const deleted = await service.remove(Number(req.params.id));
      if (!deleted) return sendError(res, `${entityName} not found.`, HTTP_STATUS.NOT_FOUND);
      return sendSuccess(res, { id: Number(req.params.id) });
    })
  };
};
