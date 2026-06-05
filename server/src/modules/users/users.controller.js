import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { usersService } from "./users.service.js";

/** GET /api/users — User list with filter/pagination (admin) */
export const getUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getAll(req.query);
  return sendSuccess(res, data);
});

/** GET /api/users/pending — Users pending account approval (admin) */
export const getPendingUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getPendingApproval();
  return sendSuccess(res, data);
});

/** GET /api/users/:id — User detail (admin) */
export const getUserById = asyncHandler(async (req, res) => {
  const data = await usersService.getById(Number(req.params.id));
  if (!data) return sendError(res, "User not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/** PUT /api/users/:id/role — Update role + club_id (admin) */
export const updateUserRole = asyncHandler(async (req, res) => {
  const data = await usersService.updateRole(Number(req.params.id), req.body.role, req.body.clubId);
  if (!data) return sendError(res, "User not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/** PUT /api/users/:id/active — Lock / unlock account (admin) */
export const toggleUserActive = asyncHandler(async (req, res) => {
  const data = await usersService.setActive(Number(req.params.id), Boolean(req.body.isActive));
  if (!data) return sendError(res, "User not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/** POST /api/users — Admin directly creates a user */
export const createUser = asyncHandler(async (req, res) => {
  const data = await usersService.createDirect(req.body);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

/** PUT /api/users/:id — Admin directly updates user information */
export const updateUser = asyncHandler(async (req, res) => {
  const data = await usersService.updateUser(Number(req.params.id), req.body);
  if (!data) return sendError(res, "User not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/** DELETE /api/users/:id — Admin directly deletes user */
export const deleteUser = asyncHandler(async (req, res) => {
  const data = await usersService.remove(Number(req.params.id), req.user.id);
  if (!data) return sendError(res, "User not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { message: "User deleted successfully." });
});

