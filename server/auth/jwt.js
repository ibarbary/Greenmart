import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

function generateTokens(user, rememberMe = false) {
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { ...user, tokenType: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: rememberMe ? "30d" : "7d",
    }
  );

  return { accessToken, refreshToken };
}

function verifyToken(req, res, next) {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res
      .status(401)
      .json({ error: "Access Denied", code: "TOKEN_MISSING" });
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = payload;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(403).json({ error: "Invalid access token" });
  }
}

function optionalAuth(req, res, next) {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

export { generateTokens, verifyToken, optionalAuth };
