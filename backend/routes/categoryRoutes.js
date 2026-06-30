// ============================================================
// FILE: backend/routes/categoryRoutes.js
// OWNER: Member 2 (Backend Dev)
// ============================================================

import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.use(requireAuth);
router.route("/").get(getCategories).post(createCategory);
router.route("/:id").put(updateCategory).delete(deleteCategory);

export default router;