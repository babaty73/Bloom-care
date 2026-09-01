import mongoose from "mongoose";
import { ApiError } from "../utils/apiResponse.js";

// Lightweight, dependency-free validation middleware.
// Contract: docs/ARCHITECTURE.md Validation Contract — this layer checks required
// fields, basic formats, ObjectId syntax, query params, enums, and basic numeric
// constraints. Ownership, cross-document relationships, and business rules belong
// in the service layer, not here.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function fail(details) {
  return new ApiError(400, "VALIDATION_ERROR", "Validation failed", details);
}

export function isValidObjectId(value) {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

export function validateObjectIdParam(paramName) {
  return function objectIdGuard(req, res, next) {
    const value = req.params[paramName];
    if (!isValidObjectId(value)) {
      return next(fail([`${paramName} must be a valid id`]));
    }
    return next();
  };
}

export function validatePharmacyRegister(req, res, next) {
  const { pharmacyName, address, phone, email, password, googleMapsLink, openingTime, closingTime } = req.body || {};
  const details = [];

  if (!pharmacyName || typeof pharmacyName !== "string") details.push("pharmacyName is required");
  if (!address || typeof address !== "string") details.push("address is required");
  if (!phone || typeof phone !== "string") details.push("phone is required");
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) details.push("a valid email is required");
  if (!googleMapsLink || typeof googleMapsLink !== "string") details.push("googleMapsLink is required");
  if (!openingTime || !TIME_RE.test(openingTime)) details.push("openingTime must be in HH:mm 24-hour format");
  if (!closingTime || !TIME_RE.test(closingTime)) details.push("closingTime must be in HH:mm 24-hour format");
  if (openingTime && closingTime && openingTime === closingTime) details.push("closingTime must not equal openingTime");

  if (!password || typeof password !== "string" || password.length < 8) {
    details.push("password must be at least 8 characters long");
  } else {
    if (!/[A-Za-z]/.test(password)) details.push("password must contain at least one letter");
    if (!/[0-9]/.test(password)) details.push("password must contain at least one number");
  }

  if (details.length > 0) return next(fail(details));
  return next();
}

export function validatePharmacyLogin(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];
  if (!email || typeof email !== "string") details.push("email is required");
  if (!password || typeof password !== "string") details.push("password is required");
  if (details.length > 0) return next(fail(details));
  return next();
}

export function validateAdminLogin(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];
  if (!email || typeof email !== "string") details.push("email is required");
  if (!password || typeof password !== "string") details.push("password is required");
  if (details.length > 0) return next(fail(details));
  return next();
}

export function validatePharmacyProfileUpdate(req, res, next) {
  const body = req.body || {};
  const allowedFields = ["pharmacyName", "address", "phone", "googleMapsLink", "openingTime", "closingTime", "logo"];
  const details = [];

  const providedFields = Object.keys(body);
  if (providedFields.length === 0) {
    details.push("at least one field must be provided");
  }
  for (const field of providedFields) {
    if (!allowedFields.includes(field)) {
      details.push(`${field} is not an editable field`);
    }
  }

  if (body.openingTime !== undefined && !TIME_RE.test(body.openingTime)) {
    details.push("openingTime must be in HH:mm 24-hour format");
  }
  if (body.closingTime !== undefined && !TIME_RE.test(body.closingTime)) {
    details.push("closingTime must be in HH:mm 24-hour format");
  }
  if (
    body.openingTime !== undefined &&
    body.closingTime !== undefined &&
    body.openingTime === body.closingTime
  ) {
    details.push("closingTime must not equal openingTime");
  }
  for (const field of ["pharmacyName", "address", "phone", "googleMapsLink"]) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].trim() === "")) {
      details.push(`${field} must be a non-empty string`);
    }
  }

  if (details.length > 0) return next(fail(details));
  return next();
}

export function validateMedicineCreate(req, res, next) {
  const { medicineName, genericName, price, quantity, expirationDate } = req.body || {};
  const details = [];

  if (!medicineName || typeof medicineName !== "string") details.push("medicineName is required");
  if (!genericName || typeof genericName !== "string") details.push("genericName is required");
  if (typeof price !== "number" || Number.isNaN(price) || price < 0) details.push("price must be a non-negative number");
  if (typeof quantity !== "number" || Number.isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    details.push("quantity must be a non-negative integer");
  }
  if (expirationDate !== undefined && expirationDate !== null && Number.isNaN(Date.parse(expirationDate))) {
    details.push("expirationDate must be a valid date");
  }

  if (details.length > 0) return next(fail(details));
  return next();
}

export function validateMedicineUpdate(req, res, next) {
  const body = req.body || {};
  const allowedFields = [
    "medicineName",
    "genericName",
    "brandName",
    "description",
    "category",
    "price",
    "quantity",
    "expirationDate",
  ];
  const details = [];

  const providedFields = Object.keys(body);
  if (providedFields.length === 0) {
    details.push("at least one field must be provided");
  }
  for (const field of providedFields) {
    if (!allowedFields.includes(field)) {
      details.push(`${field} is not an editable field`);
    }
  }

  if (body.price !== undefined && (typeof body.price !== "number" || Number.isNaN(body.price) || body.price < 0)) {
    details.push("price must be a non-negative number");
  }
  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== "number" || Number.isNaN(body.quantity) || body.quantity < 0 || !Number.isInteger(body.quantity))
  ) {
    details.push("quantity must be a non-negative integer");
  }
  if (
    body.expirationDate !== undefined &&
    body.expirationDate !== null &&
    Number.isNaN(Date.parse(body.expirationDate))
  ) {
    details.push("expirationDate must be a valid date");
  }

  if (details.length > 0) return next(fail(details));
  return next();
}

export function validatePagination(req, res, next) {
  const details = [];
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  let page = 1;
  let limit = 20;

  if (rawPage !== undefined) {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) details.push("page must be a positive integer");
  }
  if (rawLimit !== undefined) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) details.push("limit must be an integer between 1 and 50");
  }

  if (details.length > 0) return next(fail(details));

  req.pagination = { page, limit };
  return next();
}
