import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { newsService } from "./news.service.js";

/**
 * GET /api/news — List of published articles (public)
 */
export const getNews = asyncHandler(async (req, res) => {
  const data = await newsService.getPublished(req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/my — Articles by the current editor (auth)
 */
export const getMyNews = asyncHandler(async (req, res) => {
  const data = await newsService.getMyNews(req.user.id, req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/:id — Article detail (id) for editor/admin
 */
export const getNewsById = asyncHandler(async (req, res) => {
  const data = await newsService.getById(Number(req.params.id));
  if (!data) return sendError(res, "Article not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * GET /api/news/slug/:slug — Article detail (slug) public
 */
export const getNewsBySlug = asyncHandler(async (req, res) => {
  const data = await newsService.getBySlug(req.params.slug);
  if (!data) return sendError(res, "Article not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * POST /api/news — Create an article (editor)
 */
export const createNews = asyncHandler(async (req, res) => {
  const data = await newsService.create(req.body, req.user.id);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

/**
 * PUT /api/news/:id — Update an article (editor, own articles only, draft/rejected)
 */
export const updateNews = asyncHandler(async (req, res) => {
  const data = await newsService.update(Number(req.params.id), req.body, req.user.id);
  if (!data) return sendError(res, "Article not found or cannot be edited.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * DELETE /api/news/:id — Delete an article (editor, own articles only, draft/rejected)
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const deleted = await newsService.remove(Number(req.params.id), req.user.id);
  if (!deleted) return sendError(res, "Article not found or cannot be deleted.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});

/**
 * POST /api/news/:id/submit — Submit article for admin review (editor)
 */
export const submitNews = asyncHandler(async (req, res) => {
  const data = await newsService.submit(Number(req.params.id), req.user.id);
  return sendSuccess(res, data);
});
