// import dotenv from "dotenv";
// import cors from "cors";
// import express from "express";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import cookieParser from "cookie-parser";
// import productRouter from "./routes/product.router.js";
// import categoryRouter from "./routes/category.router.js";
// import authRouter from "./routes/auth.router.js";
// import cartRouter from "./routes/cart.router.js";
// import { verifyToken } from "./auth/jwt.js";
// import addressRouter from "./routes/addresses.router.js";
// import orderRouter from "./routes/order.router.js";
// import statusRouter from "./routes/status.router.js";
// import complaintRouter from "./routes/complaint.router.js";

// dotenv.config();

// const app = express();

// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: "Too many requests from this IP, please try again after 10 minutes.",
// });

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
//     },
//   })
// );

// app.use(limiter);
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());

// app.use("/api/auth", authRouter);
// app.use("/api/products", productRouter);
// app.use("/api/categories", categoryRouter);
// app.use("/api/cart", verifyToken, cartRouter);
// app.use("/api/addresses", verifyToken, addressRouter);
// app.use("/api/orders", verifyToken, orderRouter);
// app.use("/api/statuses", statusRouter);
// app.use("/api/complaints", verifyToken, complaintRouter);

// app.get("*", (req, res) => {
//   const frontendUrl = process.env.CLIENT_URL;
//   res.redirect(frontendUrl + req.originalUrl);
// });

// export default app;

// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
//   });
// }
import express from "express";

const app = express();

// Basic middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Health check passed" });
});

// Catch-all for debugging
app.get("*", (req, res) => {
  res.json({
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Export for Vercel
export default app;
