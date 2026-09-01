import * as medicineService from "../services/medicine.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

// NOTE: This file is shared with the medicine-search domain. Only the pharmacy-owned
// CRUD handlers (mounted under /api/pharmacies/me/medicines) are implemented here.
// Public search handlers (GET /api/medicines, GET /api/medicines/:id) belong to that
// domain and should be added here, not replace these exports.

export async function createMedicine(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const medicine = await medicineService.createMedicineForPharmacy(pharmacyId, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      data: medicine,
      message: "Medicine added successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateMedicine(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const { id } = req.params;
    const medicine = await medicineService.updateMedicineForPharmacy(pharmacyId, id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      data: medicine,
      message: "Medicine updated successfully",
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteMedicine(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const { id } = req.params;
    await medicineService.deleteMedicineForPharmacy(pharmacyId, id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function listOwnMedicines(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const result = await medicineService.listMedicinesForPharmacy(pharmacyId, req.pagination);
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Medicines retrieved successfully",
    });
  } catch (err) {
    return next(err);
  }
}
