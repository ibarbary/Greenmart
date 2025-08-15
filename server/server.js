import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import productRouter from "./routes/product.router.js";
import categoryRouter from "./routes/category.router.js";
import authRouter from "./routes/auth.router.js";
import cartRouter from "./routes/cart.router.js";
import { verifyToken } from "./auth/jwt.js";
import addressRouter from "./routes/addresses.router.js";
import orderRouter from "./routes/order.router.js";
import statusRouter from "./routes/status.router.js";
import complaintRouter from "./routes/complaint.router.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 10 minutes.",
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  })
);

app.use(limiter);
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/cart", verifyToken, cartRouter);
app.use("/api/addresses", verifyToken, addressRouter);
app.use("/api/orders", verifyToken, orderRouter);
app.use("/api/statuses", statusRouter);
app.use("/api/complaints", verifyToken, complaintRouter);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/", (req, res) => {
  res.send("Hello Greenmart!");
});

app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
