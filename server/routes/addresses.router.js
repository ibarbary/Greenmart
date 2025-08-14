import express from "express";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../controllers/addresses.controller.js";

const addressRouter = express.Router();

addressRouter.get("/", getAddresses);
addressRouter.post("/", addAddress);
addressRouter.put("/:addressId", updateAddress);
addressRouter.delete("/:addressId", deleteAddress);

export default addressRouter;
