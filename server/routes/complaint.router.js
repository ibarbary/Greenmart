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
  addComplaint,
  getComplaints,
  updateComplaintStatus,
} from "../controllers/complaint.controller.js";

const complaintRouter = express.Router();

complaintRouter.post("/", upload.single("image"), addComplaint);
complaintRouter.get("/", getComplaints);
complaintRouter.put("/:id/status", updateComplaintStatus);

export default complaintRouter;
