import express from "express";
import { getAllStatuses } from "../controllers/status.controller.js";

const statusRouter = express.Router();

statusRouter.get("/", getAllStatuses);

export default statusRouter;
