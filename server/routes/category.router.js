import express from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

import {
  addCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  updateCategoryActiveStatus,
} from "../controllers/category.controller.js";

const categoryRouter = express.Router();

categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:id", getCategory);
categoryRouter.post("/", upload.single("image"), addCategory);
categoryRouter.patch("/:id/status", updateCategoryActiveStatus);
categoryRouter.put(
  "/:id",
  (req, res, next) => {
    const contentType = req.headers["content-type"];
    if (contentType && contentType.includes("multipart/form-data")) {
      upload.single("image")(req, res, next);
    } else {
      next();
    }
  },
  updateCategory
);

export default categoryRouter;
