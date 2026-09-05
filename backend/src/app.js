import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import contactsRouter from "./routes/contacts.js";
import dealsRouter from "./routes/deals.js";
import activitiesRouter from "./routes/activities.js";
import stagesRouter from "./routes/stages.js";
import forecastRouter from "./routes/forecast.js";
import alertsRouter from "./routes/alerts.js";
import usersRouter from "./routes/users.js";
import analyticsRouter from "./routes/analytics.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/contacts", contactsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/stages", stagesRouter);
app.use("/api/forecast", forecastRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/users", usersRouter);
app.use("/api/analytics", analyticsRouter);

// روی Railway فرانت‌اند به‌صورت static build از همین سرویس بک‌اند سرو می‌شود
// (یک origin و یک لینک واحد). اگر build فرانت‌اند وجود نداشته باشد (مثلاً در
// حالت توسعه‌ی محلی که فرانت‌اند جدا با vite dev اجرا می‌شود)، این بخش نادیده
// گرفته می‌شود و رفتار قبلی (فقط API) حفظ می‌شود.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
