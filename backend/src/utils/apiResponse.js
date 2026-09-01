// Contract: docs/ARCHITECTURE.md / IMPLEMENTATION_DECISIONS.md — standard response envelope.
// Never construct endpoint-specific response shapes; always go through these helpers.

export function sendSuccess(res, { statusCode = 200, data = null, message = "Success" } = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendError(res, { statusCode = 500, code = "INTERNAL_SERVER_ERROR", message = "Something went wrong", details = [] } = {}) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: { code, details },
  });
}
