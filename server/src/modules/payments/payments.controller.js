import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { paymentsService } from "./payments.service.js";

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const data = await paymentsService.createIntent({
    userId: req.user.id,
    ticketIds: req.body.ticketIds,
    currency: req.body.currency || "vnd"
  });
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return sendError(res, "Missing stripe-signature.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await paymentsService.handleWebhook(req.body, signature);
  return sendSuccess(res, data);
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    return sendError(res, "Missing paymentIntentId.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await paymentsService.confirmLocalPayment(paymentIntentId);
  return sendSuccess(res, data);
});
