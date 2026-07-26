import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth, requireAdmin } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { partnersRouter } from "./routes/partners.js";
import { representativesRouter } from "./routes/representatives.js";
import { insightsRouter } from "./routes/insights.js";
import { usersRouter } from "./routes/users.js";
import { auditLogRouter } from "./routes/auditLog.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);

app.use("/api/partners", requireAuth, partnersRouter);
app.use("/api/representatives", requireAuth, representativesRouter);
app.use("/api/insights", requireAuth, insightsRouter);
app.use("/api/users", requireAuth, requireAdmin, usersRouter);
app.use("/api/audit-log", requireAuth, requireAdmin, auditLogRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
