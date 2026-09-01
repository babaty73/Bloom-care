import * as pharmacyService from "../services/pharmacy.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getPharmacyById(req, res, next) {
  try {
    const { id } = req.params;
    const pharmacy = await pharmacyService.getPharmacyById(id);
    return sendSuccess(res, { statusCode: 200, data: pharmacy, message: "Pharmacy retrieved successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function getOwnProfile(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const pharmacy = await pharmacyService.getOwnProfile(pharmacyId);
    return sendSuccess(res, { statusCode: 200, data: pharmacy, message: "Profile retrieved successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function updateOwnProfile(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const pharmacy = await pharmacyService.updateOwnProfile(pharmacyId, req.body);
    return sendSuccess(res, { statusCode: 200, data: pharmacy, message: "Profile updated successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function getOwnDashboard(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const dashboard = await pharmacyService.getOwnDashboard(pharmacyId);
    return sendSuccess(res, { statusCode: 200, data: dashboard, message: "Dashboard retrieved successfully" });
  } catch (err) {
    return next(err);
  }
}
