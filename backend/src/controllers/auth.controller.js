import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

// Controllers stay thin: parse request, call service, shape the envelope response.

export async function registerPharmacy(req, res, next) {
  try {
    const { pharmacyName, address, phone, email, password, googleMapsLink, openingTime, closingTime } = req.body;
    const result = await authService.registerPharmacy({
      pharmacyName,
      address,
      phone,
      email,
      password,
      googleMapsLink,
      openingTime,
      closingTime,
    });
    return sendSuccess(res, {
      statusCode: 201,
      data: result,
      message: "Pharmacy registered successfully",
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
