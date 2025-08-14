import express from "express";
import {
  addCartItem,
  deleteCartItem,
  getCartItems,
  updateCartItem,
} from "../controllers/cart.controller.js";

const cartRouter = express.Router();

cartRouter.get("/:cartId", getCartItems);
cartRouter.post("/", addCartItem);
cartRouter.put("/:itemId", updateCartItem);
cartRouter.delete("/:itemId", deleteCartItem);

export default cartRouter;
