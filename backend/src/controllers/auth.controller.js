import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

// Controllers stay thin: parse request, call service, shape the envelope response.

export async function registerPharmacy(req, res, next) {
  try {
    const { pharmacyName, address, phone, email, password, googleMapsLink, openingTime, closingTime, licenseNumber } =
      req.body;
    const result = await authService.registerPharmacy({
      pharmacyName,
      address,
      phone,
      email,
      password,
      googleMapsLink,
      openingTime,
      closingTime,
      licenseNumber,
    });
    // 201: an application resource was created. No token/session is issued —
    // see auth.service.js registerPharmacy (Pharmacy Verification).
    return sendSuccess(res, {
      statusCode: 201,
      data: result,
      message: "Application submitted successfully. Your pharmacy will be reviewed by an admin before it appears in search.",
    });
  } catch (err) {
    return next(err);
  }
}

export async function loginPharmacy(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginPharmacy({ email, password });
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Logged in successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin({ email, password });
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Logged in successfully",
    });
  } catch (err) {
    return next(err);
  }
}
