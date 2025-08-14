import express from "express";
import {
  cancelOrderItem,
  createOrder,
  getAllOrders,
  getOrderItem,
  getUserOrders,
  updateOrderItemsStatus,
} from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.get("/", getUserOrders);
orderRouter.get("/item/:orderItemId", getOrderItem);
orderRouter.get("/all", getAllOrders);
orderRouter.post("/", createOrder);
orderRouter.put("/item/:orderItemId/cancel", cancelOrderItem);
orderRouter.put("/item/status", updateOrderItemsStatus);

export default orderRouter;
