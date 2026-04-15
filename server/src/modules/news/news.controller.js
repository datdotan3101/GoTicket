import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { newsService } from "./news.service.js";

export const getNews = asyncHandler(async (req, res) => {
  const data = await newsService.getPublished();
  return sendSuccess(res, data);
});

export const getNewsBySlug = asyncHandler(async (req, res) => {
  const data = await newsService.getBySlug(req.params.slug);
  if (!data) return sendError(res, "Không tìm thấy bài viết.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const createNews = asyncHandler(async (req, res) => {
  const data = await newsService.create(req.body, req.user.id);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const updateNews = asyncHandler(async (req, res) => {
  const data = await newsService.update(Number(req.params.id), req.body, req.user.id);
  if (!data) return sendError(res, "Không tìm thấy bài viết.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const deleteNews = asyncHandler(async (req, res) => {
  const deleted = await newsService.remove(Number(req.params.id), req.user.id);
  if (!deleted) return sendError(res, "Không tìm thấy bài viết.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});

export const submitNews = asyncHandler(async (req, res) => {
  const data = await newsService.submit(Number(req.params.id), req.user.id);
  return sendSuccess(res, data);
});
