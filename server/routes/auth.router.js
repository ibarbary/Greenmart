import express from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  verifyLoggedIn,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../auth/jwt.js";

const authRouter = express.Router();

authRouter.post("/signup", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/verify", verifyToken, verifyLoggedIn);
authRouter.get("/logout", logoutUser);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/resend-verification", resendVerificationEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/refresh-token", refreshAccessToken);

export default authRouter;
