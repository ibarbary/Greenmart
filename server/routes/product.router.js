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
  addProduct,
  getProduct,
  getProducts,
  updateProduct,
  updateProductStock,
} from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);
productRouter.patch("/:id/stock", updateProductStock);
productRouter.put(
  "/:id",
  (req, res, next) => {
    const contentType = req.headers["content-type"];
    if (contentType && contentType.includes("multipart/form-data")) {
      upload.array("newImages", 4)(req, res, next);
    } else {
      next();
    }
  },
  updateProduct
);
productRouter.post("/", upload.array("images", 4), addProduct);

export default productRouter;
