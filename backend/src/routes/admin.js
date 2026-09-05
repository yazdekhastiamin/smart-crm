import { Router } from "express";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { prisma } from "../config/prisma.js";

const execFileAsync = promisify(execFile);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// مسیر موقت و یک‌بارمصرف برای پر کردن دیتابیس production با داده‌ی دمو
// (بعد از تأیید نتیجه باید از app.js حذف شود — بخش SPEC مربوط به دیپلوی).
// پشت یک توکن مخفی (ADMIN_SEED_TOKEN، فقط در env سرویس production ست
// می‌شود، هرگز در گیت) قرار دارد و اگر داده‌ای از قبل وجود داشته باشد
// (برای جلوگیری از seed تکراری) رد می‌شود.
const SCRIPTS = ["prisma/seedOpenDeals.js", "prisma/seedForecastHistory.js", "prisma/importSampleDeals.js"];

const router = Router();

router.post("/seed-demo-data", async (req, res) => {
  const expectedToken = process.env.ADMIN_SEED_TOKEN;
  if (!expectedToken || req.get("x-admin-token") !== expectedToken) {
    return res.status(404).json({ error: "Not found" });
  }

  const existingDeals = await prisma.deal.count();
  if (existingDeals > 0) {
    return res.status(409).json({ error: `Deals already exist (${existingDeals}) — refusing to seed again.` });
  }

  const results = [];
  for (const script of SCRIPTS) {
    try {
      const { stdout } = await execFileAsync("node", [script], { cwd: backendRoot });
      results.push({ script, ok: true, output: stdout.trim() });
    } catch (err) {
      results.push({ script, ok: false, output: (err.stdout || "").trim(), error: err.message });
      return res.status(500).json({ results });
    }
  }

  res.json({ results });
});

export default router;
