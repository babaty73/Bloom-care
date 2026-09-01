import { sendError } from "../utils/apiResponse.js";

export function notFoundMiddleware(req, res) {
  return sendError(res, {
    statusCode: 404,
    code: "RESOURCE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
