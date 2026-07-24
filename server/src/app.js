import express from "express";
import cors from "cors";
import { partnersRouter } from "./routes/partners.js";
import { publicRouter } from "./routes/public.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/partners", partnersRouter);
app.use("/api/public", publicRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
