import { generateTokens } from "../auth/jwt.js";
import { isStrongPassword, isValidEmail } from "../auth/validators.js";
import pool from "../db/connection.js";
import queryList from "../db/queries.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/email.services.js";
dotenv.config();

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setAuthCookies(res, accessToken, refreshToken, rememberMe = false) {
  const refreshExpiry = rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: refreshExpiry,
  });
}

function createUserResponse(user, cartId) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    cartId: cartId,
  };
}

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  if (!isValidEmail(email))
    return res.status(400).json({ error: "Invalid email" });

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkResult = await client.query(
      queryList.CHECK_USER_AND_PENDING_EXIST,
      [email.toLowerCase()]
    );

    if (checkResult.rows.length > 0) {
      const existingRecord = checkResult.rows[0];
      if (existingRecord.table_name === "users") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Email already registered" });
      } else {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error:
            "Email verification already sent. Please check your inbox or request a new one.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationToken = generateSecureToken();
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    await client.query(queryList.CREATE_PENDING_USER, [
      name.trim(),
      email.toLowerCase(),
      hashedPassword,
      verificationToken,
      tokenExpiry,
    ]);

    await client.query("COMMIT");

    await sendVerificationEmail(email, verificationToken, name);

    return res.status(200).json({
      email: email.toLowerCase(),
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  } finally {
    client.release();
  }
}

async function verifyEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(queryList.GET_PENDING_USER_BY_TOKEN, [
      token,
    ]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Invalid or expired verification token",
      });
    }

    const pendingUser = result.rows[0];

    const userResult = await client.query(queryList.CREATE_USER, [
      pendingUser.name,
      pendingUser.email,
      pendingUser.password,
    ]);

    const user = userResult.rows[0];

    const cartResult = await client.query(queryList.CREATE_USER_CART, [
      user.id,
    ]);
    const cartId = cartResult.rows[0].id;

    await client.query(queryList.DELETE_PENDING_USER, [pendingUser.id]);

    await client.query("COMMIT");

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      type: user.type,
    });
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
    await storeRefreshToken(user.id, refreshToken, refreshExpiry);

    setAuthCookies(res, accessToken, refreshToken);

    const userResponse = createUserResponse(user, cartId);

    res.status(201).json({
      user: userResponse,
      message: "Email verified successfully! Your account has been created.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Email verification error:", error);
    return res.status(500).json({ error: "Failed to verify email" });
  } finally {
    client.release();
  }
}

async function cleanupExpiredPendingUsers() {
  try {
    const queryText = queryList.DELETE_EXPIRED_PENDING_USERS;
    await pool.query(queryText);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

setInterval(cleanupExpiredPendingUsers, 60 * 60 * 1000);

async function resendVerificationEmail(req, res) {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await pool.query(queryList.GET_PENDING_USER_BY_EMAIL, [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "No pending verification found for this email",
      });
    }

    const pendingUser = result.rows[0];
    const newToken = generateSecureToken();
    const newExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    await pool.query(queryList.UPDATE_PENDING_USER_TOKEN, [
      newToken,
      newExpiresAt,
      pendingUser.id,
    ]);

    await sendVerificationEmail(email, newToken, pendingUser.name);

    res.status(200).json({
      message:
        "Verification email resent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      error: "Failed to resend verification email",
    });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await pool.query(queryList.CHECK_USER_EXIST, [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No account found with this email address",
      });
    }

    const resetToken = generateSecureToken();
    const tokenExpiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    await pool.query(queryList.UPSERT_PASSWORD_RESET, [
      email.toLowerCase(),
      resetToken,
      tokenExpiry,
    ]);

    await sendPasswordResetEmail(email.toLowerCase(), resetToken);

    return res.status(200).json({
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json({ error: "Failed to process password reset request" });
  }
}

async function cleanupExpiredPasswordResets() {
  try {
    const queryText = queryList.DELETE_EXPIRED_PASSWORD_RESETS;
    await pool.query(queryText);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

setInterval(cleanupExpiredPasswordResets, 15 * 60 * 1000);

async function resetPassword(req, res) {
  const { email, password, confirmPassword, token } = req.body;

  if (!email?.trim() || !token || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      queryList.GET_PASSWORD_RESET_WITH_EMAIL,
      [token, email.toLowerCase()]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const resetRecord = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const updateResult = await client.query(queryList.UPDATE_USER_PASSWORD, [
      hashedPassword,
      email.toLowerCase(),
    ]);

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    await client.query(queryList.DELETE_PASSWORD_RESET, [resetRecord.id]);

    await client.query("COMMIT");

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  } finally {
    client.release();
  }
}

async function storeRefreshToken(userId, refreshToken, expiresAt) {
  try {
    const queryText = queryList.CREATE_REFRESH_TOKEN;
    await pool.query(queryText, [userId, refreshToken, expiresAt]);
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw error;
  }
}

async function cleanupExpiredRefreshTokens() {
  try {
    await pool.query(queryList.DELETE_EXPIRED_REFRESH_TOKENS);
  } catch (error) {
    console.error("Cleanup refresh tokens error:", error);
  }
}

setInterval(cleanupExpiredRefreshTokens, 60 * 60 * 1000);

async function refreshAccessToken(req, res) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(204).end();
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (payload.tokenType !== "refresh") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    let queryText = queryList.CHECK_REFRESH_TOKEN_EXIST;
    let result = await pool.query(queryText, [payload.id, refreshToken]);

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired refresh token" });
    }

    queryText = queryList.GET_USER_WITH_CART_BY_ID;
    result = await pool.query(queryText, [payload.id]);

    const userData = result.rows[0];

    const newAccessToken = jwt.sign(
      { id: userData.id, type: userData.type },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    const user = createUserResponse(userData, userData.cart_id);

    return res
      .status(200)
      .json({ user, message: "Token refreshed successfully" });
  } catch (error) {
    console.error(error);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(400).json({ error: "Invalid refresh token" });
  }
}

async function loginUser(req, res) {
  const { email, password, rememberMe } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(queryList.GET_USER_WITH_CART, [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const userData = result.rows[0];

    const match = await bcrypt.compare(password, userData.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(
      {
        id: userData.id,
        type: userData.type,
      },
      rememberMe
    );

    const refreshExpiry = new Date(
      Date.now() + (rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY)
    );

    await storeRefreshToken(userData.id, refreshToken, refreshExpiry);

    setAuthCookies(res, accessToken, refreshToken, rememberMe);

    const user = createUserResponse(userData, userData.cart_id);

    return res.status(200).json({ user, message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error, couldn't login!" });
  }
}

async function verifyLoggedIn(req, res) {
  if (!req.user || !req.user.id) {
    return res.status(200).json({ user: null });
  }

  try {
    const result = await pool.query(queryList.GET_USER_WITH_CART_BY_ID, [
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(200).json({ user: null });
    }

    const userData = result.rows[0];
    const user = createUserResponse(userData, userData.cart_id);

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Verify logged in error:", error);
    return res.status(500).json({
      error: "Failed to verify that user is logged in",
    });
  }
}

async function logoutUser(req, res) {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    try {
      const queryText = queryList.DELETE_REFRESH_TOKEN;
      await pool.query(queryText, [refreshToken]);
    } catch (error) {
      console.error("Error revoking refresh token:", error);
    }
  }

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res.status(200).json({ message: "Logged out successfully" });
}

export {
  registerUser,
  verifyEmail,
  loginUser,
  verifyLoggedIn,
  logoutUser,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};
