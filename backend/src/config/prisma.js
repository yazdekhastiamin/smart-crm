import { PrismaClient } from "@prisma/client";

// دو فیلد پولی (Deal.value و ForecastSnapshot.totalForecast) در schema.prisma
// از نوع Decimal هستند (دقت مالی روی Postgres)، اما بقیه‌ی کد پروژه
// (forecastEngine، priorityEngine، خروجی اکسل، ...) با عدد جاوااسکریپت معمولی
// جمع/ضرب/مقایسه می‌کند. این extension همان‌جای ورودی، Decimal را به Number
// تبدیل می‌کند تا نیازی به تغییر آن محاسبات نباشد.
export const prisma = new PrismaClient().$extends({
  result: {
    deal: {
      value: {
        needs: { value: true },
        compute(deal) {
          return deal.value.toNumber();
        },
      },
    },
    forecastSnapshot: {
      totalForecast: {
        needs: { totalForecast: true },
        compute(snapshot) {
          return snapshot.totalForecast.toNumber();
        },
      },
    },
  },
});
