// اجرا در زنجیره‌ی start (نه از طریق HTTP) تا دیتابیس production که تازه
// ساخته شده، همان داده‌ی دموی محلی (۸ معامله‌ی باز + تاریخچه‌ی KPI + ۳۰
// معامله‌ی تاریخی بسته‌شده) را داشته باشد. فقط وقتی هیچ معامله‌ای در
// دیتابیس نباشد اجرا می‌شود، چون seedOpenDeals/seedForecastHistory/
// importSampleDeals خودشان idempotent نیستند و نباید دوباره روی داده‌ی
// واقعی مشتری تکرار شوند.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = ["prisma/seedOpenDeals.js", "prisma/seedForecastHistory.js", "prisma/importSampleDeals.js"];

async function main() {
  const existingDeals = await prisma.deal.count();
  if (existingDeals > 0) {
    console.log(`seedDemoDataIfEmpty: ${existingDeals} deal(s) already exist — skipping demo seed.`);
    return;
  }

  for (const script of SCRIPTS) {
    console.log(`seedDemoDataIfEmpty: running ${script}`);
    execFileSync("node", [script], { cwd: backendRoot, stdio: "inherit" });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
