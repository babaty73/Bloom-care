import { ApiError, sendError } from "../utils/apiResponse.js";

// Centralized error handler. Contract: docs/ARCHITECTURE.md error envelope + HTTP status contract.
// Never leak stack traces, secrets, or password hashes in the response.
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  if (err instanceof ApiError) {
    return sendError(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Mongoose validation errors -> 400 VALIDATION_ERROR
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return sendError(res, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details,
    });
  }

  // Mongoose duplicate key error -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return sendError(res, {
      statusCode: 409,
      code: field === "email" ? "DUPLICATE_EMAIL" : "RESOURCE_NOT_FOUND",
      message: `${field} already in use`,
      details: [],
    });
  }

  // Invalid ObjectId cast -> 400
  if (err.name === "CastError") {
    return sendError(res, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `Invalid value for ${err.path}`,
      details: [],
    });
  }

  // Body-parser errors (malformed JSON, oversized request body) arrive as
  // plain http-errors-shaped objects, not our ApiError. These are routine,
  // expected client-caused conditions (a typo'd request body, a client bug),
  // not application bugs — handle them cleanly rather than falling through to
  // the generic 500 + stack-trace log below, which would both mislabel the
  // response (client error, not server error) and add noise that could bury
  // genuine unexpected errors in production logs.
  if (typeof err.type === "string" && err.type.startsWith("entity.")) {
    const isTooLarge = err.status === 413 || err.statusCode === 413;
    return sendError(res, {
      statusCode: isTooLarge ? 413 : 400,
      code: isTooLarge ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR",
      message: isTooLarge ? "Request body is too large" : "Request body could not be parsed as JSON",
      details: [],
    });
  }

  console.error(err);

  return sendError(res, {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    details: [],
  });
}
