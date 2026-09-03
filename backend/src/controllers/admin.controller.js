import * as adminService from "../services/admin.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getDashboard(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, {
      statusCode: 200,
      data: stats,
      message: "Dashboard statistics retrieved successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function listPharmacies(req, res, next) {
  try {
    const { status } = req.query;
    const result = await adminService.listPharmacies({ status }, req.pagination);
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Pharmacies retrieved successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function updatePharmacyStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pharmacy = await adminService.updatePharmacyStatus(id, status);
    return sendSuccess(res, {
      statusCode: 200,
      data: pharmacy,
      message: "Pharmacy status updated successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function deletePharmacy(req, res, next) {
  try {
    const { id } = req.params;
    await adminService.deletePharmacy(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function deleteMedicine(req, res, next) {
  try {
    const { id } = req.params;
    await adminService.deleteMedicine(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function listReports(req, res, next) {
  try {
    const { status, pharmacyId, medicineId } = req.query;
    const result = await adminService.listReports({ status, pharmacyId, medicineId }, req.pagination);
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Reports retrieved successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function reviewReport(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const report = await adminService.reviewReport(id, status);
    return sendSuccess(res, {
      statusCode: 200,
      data: report,
      message: "Report status updated successfully",
    });
  } catch (err) {
    return next(err);
  }
}
