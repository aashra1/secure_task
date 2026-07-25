require("dotenv").config();
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const connectDB = require("./db");
const { generalLimiter, blockListedIps } = require("./middleware/rateLimiter");
const {
  securityHeaders,
  sanitizeInput,
  preventNoSqlInjection,
} = require("./middleware/security");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const profileRoutes = require("./routes/profile");
const logger = require("./utils/logger");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3001,http://localhost:3002")
  .split(",")
  .map((origin) => origin.trim());

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(blockListedIps);
app.use(generalLimiter);
app.use(preventNoSqlInjection);
app.use(sanitizeInput);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "securetask" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, _next) => {
  logger.error({ message: error.message, stack: error.stack, path: req.path });
  res
    .status(error.status || 500)
    .json({ message: error.status ? error.message : "Internal server error" });
});

if (require.main === module) {
  connectDB()
    .then(() =>
      app.listen(process.env.PORT || 3000, () =>
        logger.info(`API listening on ${process.env.PORT || 3000}`),
      ),
    )
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

module.exports = app;
