import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { partnersRouter } from "./routes/partners.js";
import { leadsRouter } from "./routes/leads.js";
import { publicRouter } from "./routes/public.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);

app.use("/api/partners", requireAuth, partnersRouter);
app.use("/api/leads", requireAuth, leadsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
