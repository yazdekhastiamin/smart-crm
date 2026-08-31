import express from "express";
import cors from "cors";

import contactsRouter from "./routes/contacts.js";
import dealsRouter from "./routes/deals.js";
import activitiesRouter from "./routes/activities.js";
import stagesRouter from "./routes/stages.js";
import forecastRouter from "./routes/forecast.js";
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

app.use(notFoundHandler);
app.use(errorHandler);
