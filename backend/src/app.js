require("dotenv").config();
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const https = require("https");
const connectDB = require("./db");
const { generalLimiter, blockListedIps } = require("./middleware/rateLimiter");
const {
  securityHeaders,
  sanitizeInput,
  preventNoSqlInjection,
  rejectNoSqlOperators,
  validateHostHeader,
  rejectFileUploads,
} = require("./middleware/security");
const { csrfProtection } = require("./middleware/csrf");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const profileRoutes = require("./routes/profile");
const logger = require("./utils/logger");
const { validateSecurityConfig } = require("./utils/config");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "https://localhost:3001,https://localhost:3002")
  .split(",")
  .map((origin) => origin.trim());

app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.disable("x-powered-by");
app.use(validateHostHeader);
app.use(securityHeaders);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(blockListedIps);
app.use(generalLimiter);
app.use(rejectFileUploads);
app.use(rejectNoSqlOperators);
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
  validateSecurityConfig();
  const port = process.env.PORT || 3000;
  const certificatePath = process.env.HTTPS_CERT_PATH;
  const certificateKeyPath = process.env.HTTPS_KEY_PATH;

  connectDB()
    .then(() => {
      if (certificatePath && certificateKeyPath) {
        return https
          .createServer(
            {
              cert: fs.readFileSync(certificatePath),
              key: fs.readFileSync(certificateKeyPath),
            },
            app,
          )
          .listen(port, () => logger.info(`HTTPS API listening on ${port}`));
      }

      return app.listen(port, () => logger.info(`HTTP API listening on ${port}`));
    })
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

module.exports = app;
