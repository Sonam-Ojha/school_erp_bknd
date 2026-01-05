import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";



dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"], // ✅ Bearer token ke liye
  credentials: true, // ✅ optional for cookies
}));


app.use(bodyParser.json());

// ✅ Routes
app.use("/api", authRoutes);

// ✅ Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
