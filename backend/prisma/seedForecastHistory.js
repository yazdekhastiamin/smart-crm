// داده‌ی تاریخی برای اسپارک‌لاین‌های کارت‌های KPI و نمودار روند درآمد.
//
// openDealsCount / conversionRate / avgCycleDays / followUpCount برای هر روز
// گذشته از createdAt/updatedAt واقعی معاملات و فعالیت‌ها بازسازی می‌شوند —
// یعنی «اگر همان لحظه از دیتابیس عکس می‌گرفتیم» — نه عدد ساختگی.
//
// تنها totalForecast واقعاً قابل بازسازی نیست (چون تاریخچه‌ی تغییر مرحله‌ی
// هر معامله را ذخیره نمی‌کنیم)، پس یک روند صعودی معقول برای آن می‌سازیم که
// به عدد واقعی امروز ختم می‌شود.
import { PrismaClient } from "@prisma/client";
import { getPipelineForecast } from "../src/services/forecastEngine.js";

const prisma = new PrismaClient();
const DAY = 86400000;
const HISTORY_DAYS = 14;
const DEFAULT_CYCLE_DAYS = 30;

// همان آستانه‌های alertEngine.js — اینجا هم لازم است چون آن سرویس فقط
// «همین الان» را می‌فهمد، نه یک تاریخ دلخواه در گذشته.
const FOLLOW_UP_THRESHOLDS = [
  { minWinProbability: 0.7, maxDaysSinceActivity: 5 },
  { minWinProbability: 0.5, maxDaysSinceActivity: 7 },
  { minWinProbability: 0.2, maxDaysSinceActivity: 10 },
  { minWinProbability: 0, maxDaysSinceActivity: 14 },
];

function thresholdFor(winProbability) {
  return FOLLOW_UP_THRESHOLDS.find((row) => winProbability >= row.minWinProbability).maxDaysSinceActivity;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function reconstructAsOf(asOf, allDeals) {
  let openCount = 0;
  let wonCount = 0;
  let lostCount = 0;
  let cycleDaysSum = 0;
  let cycleDaysCount = 0;
  let overdueCount = 0;

  for (const deal of allDeals) {
    if (deal.createdAt > asOf) continue; // هنوز ثبت نشده بود

    const closedByThen = deal.status !== "open" && deal.updatedAt <= asOf;
    if (closedByThen) {
      if (deal.status === "won") wonCount++;
      else if (deal.status === "lost") lostCount++;
      cycleDaysSum += (deal.updatedAt.getTime() - deal.createdAt.getTime()) / DAY;
      cycleDaysCount++;
      continue;
    }

    // یا هنوز باز است، یا بعداً بسته شده — یعنی در asOf باز بوده.
    openCount++;
    const priorActivities = deal.activities.filter((a) => a.createdAt <= asOf);
    const lastActivityAt =
      priorActivities.length > 0 ? priorActivities[priorActivities.length - 1].createdAt : deal.createdAt;
    const daysSinceActivity = (asOf.getTime() - lastActivityAt.getTime()) / DAY;
    if (daysSinceActivity >= thresholdFor(deal.stage.winProbability)) overdueCount++;
  }

  return {
    openDealsCount: openCount,
    conversionRate: wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0,
    avgCycleDays: cycleDaysCount > 0 ? cycleDaysSum / cycleDaysCount : DEFAULT_CYCLE_DAYS,
    followUpCount: overdueCount,
  };
}

async function main() {
  const today = await getPipelineForecast();
  const todayTotal = today.totalForecast;

  const allDeals = await prisma.deal.findMany({
    include: { stage: true, activities: { orderBy: { createdAt: "asc" } } },
  });

  for (let i = HISTORY_DAYS; i >= 1; i--) {
    const date = startOfDay(new Date(Date.now() - i * DAY));
    // نوسان ملایم حول یک روند صعودی به‌سمت عدد امروز (فقط این یکی ساختگی است).
    const progress = 1 - i / (HISTORY_DAYS + 1);
    const noise = 1 + Math.sin(i * 1.7) * 0.04;
    const totalForecast = Math.round(todayTotal * (0.62 + progress * 0.38) * noise);

    const reconstructed = await reconstructAsOf(date, allDeals);

    await prisma.forecastSnapshot.upsert({
      where: { date },
      update: { totalForecast, ...reconstructed },
      create: { date, totalForecast, ...reconstructed },
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
