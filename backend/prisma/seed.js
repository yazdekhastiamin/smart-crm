import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// مقادیر پایه‌ی نرخ تبدیل هر مرحله طبق بخش ۳.۱ SPEC — قابل تنظیم.
const stages = [
  { name: "سرنخ", order: 1, winProbability: 0.1 },
  { name: "مذاکره", order: 2, winProbability: 0.35 },
  { name: "پیش‌فاکتور ارسال‌شده", order: 3, winProbability: 0.6 },
  { name: "چانه‌زنی نهایی", order: 4, winProbability: 0.8 },
  { name: "بسته - برد", order: 5, winProbability: 1, isWon: true },
  { name: "بسته - باخت", order: 6, winProbability: 0, isLost: true },
];

async function main() {
  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: stage,
      create: stage,
    });
  }

  await prisma.user.upsert({
    where: { email: "owner@demo.local" },
    update: {},
    create: { name: "مدیر دمو", email: "owner@demo.local", role: "owner" },
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
