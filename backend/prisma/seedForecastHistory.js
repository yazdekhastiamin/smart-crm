// داده‌ی نمایشی برای نمودار «روند پیش‌بینی درآمد» — چون این مقدار قبل از
// امروز هیچ‌وقت واقعاً ثبت نشده، یک روند صعودی معقول برای ۱۴ روز گذشته
// می‌سازیم که به عدد واقعی امروز (از forecastEngine) ختم می‌شود.
import { PrismaClient } from "@prisma/client";
import { getPipelineForecast } from "../src/services/forecastEngine.js";

const prisma = new PrismaClient();
const DAY = 86400000;
const HISTORY_DAYS = 14;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const today = await getPipelineForecast();
  const todayTotal = today.totalForecast;

  for (let i = HISTORY_DAYS; i >= 1; i--) {
    const date = startOfDay(new Date(Date.now() - i * DAY));
    // نوسان ملایم حول یک روند صعودی به‌سمت عدد امروز.
    const progress = 1 - i / (HISTORY_DAYS + 1);
    const noise = 1 + (Math.sin(i * 1.7) * 0.04);
    const totalForecast = Math.round(todayTotal * (0.62 + progress * 0.38) * noise);

    await prisma.forecastSnapshot.upsert({
      where: { date },
      update: { totalForecast },
      create: { date, totalForecast, openDealsCount: today.openDealsCount },
    });
  }

  console.log(`Seeded ${HISTORY_DAYS} days of forecast history ending at ${todayTotal.toLocaleString()}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
