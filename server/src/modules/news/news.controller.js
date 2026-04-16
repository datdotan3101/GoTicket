import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { newsService } from "./news.service.js";

/**
 * GET /api/news — Danh sách tin đã published (public)
 */
export const getNews = asyncHandler(async (req, res) => {
  const data = await newsService.getPublished(req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/my — Bài viết của editor hiện tại (auth)
 */
export const getMyNews = asyncHandler(async (req, res) => {
  const data = await newsService.getMyNews(req.user.id, req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/:id — Chi tiết bài (id) dành cho editor/admin
 */
export const getNewsById = asyncHandler(async (req, res) => {
  const data = await newsService.getById(Number(req.params.id));
  if (!data) return sendError(res, "Không tìm thấy bài viết.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/slug/:slug — Chi tiết bài (slug) public
 */
export const getNewsBySlug = asyncHandler(async (req, res) => {
  const data = await newsService.getBySlug(req.params.slug);
  if (!data) return sendError(res, "Không tìm thấy bài viết.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * POST /api/news — Tạo bài viết (editor)
 */
export const createNews = asyncHandler(async (req, res) => {
  const data = await newsService.create(req.body, req.user.id);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

/**
 * PUT /api/news/:id — Cập nhật bài (editor, chỉ bài của mình, draft/rejected)
 */
export const updateNews = asyncHandler(async (req, res) => {
  const data = await newsService.update(Number(req.params.id), req.body, req.user.id);
  if (!data) return sendError(res, "Không tìm thấy bài viết hoặc không thể chỉnh sửa.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * DELETE /api/news/:id — Xoá bài (editor, chỉ bài của mình, draft/rejected)
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const deleted = await newsService.remove(Number(req.params.id), req.user.id);
  if (!deleted) return sendError(res, "Không tìm thấy bài viết hoặc không thể xoá.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});

/**
 * POST /api/news/:id/submit — Submit bài để admin duyệt (editor)
 */
export const submitNews = asyncHandler(async (req, res) => {
  const data = await newsService.submit(Number(req.params.id), req.user.id);
  return sendSuccess(res, data);
});
