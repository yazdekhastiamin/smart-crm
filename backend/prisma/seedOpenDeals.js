// چند فرصت فروش باز و واقع‌گرایانه seed می‌کند تا فانل فروش در UI خالی
// نباشد و رنگ‌های ریسک (بر اساس تازگی تعامل و سن معامله) قابل مشاهده باشند.
// Idempotent: قبل از ساخت دوباره، فقط dealهای باز با همین علامت را پاک می‌کند.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 86400000;

const DEMO_SOURCE = "demo-pipeline-seed";

// { stageName, customer, city, value, ageDays, daysSinceActivity }
// daysSinceActivity=null یعنی از ابتدا هیچ تعاملی ثبت نشده (fallback به createdAt).
const DEALS = [
  { stage: "سرنخ", customer: "پارسا توزیع", city: "تهران", value: 60000000, ageDays: 5, daysSinceActivity: 1 },
  { stage: "سرنخ", customer: "نگین تجهیزات", city: "کرج", value: 40000000, ageDays: 20, daysSinceActivity: 15 },
  { stage: "مذاکره", customer: "پارس گروه صنعتی", city: "اصفهان", value: 180000000, ageDays: 15, daysSinceActivity: 2 },
  { stage: "مذاکره", customer: "کوروش فروشگاه‌های زنجیره‌ای", city: "کرج", value: 220000000, ageDays: 40, daysSinceActivity: 25 },
  { stage: "پیش‌فاکتور ارسال‌شده", customer: "سورن پخش", city: "شیراز", value: 150000000, ageDays: 25, daysSinceActivity: 3 },
  { stage: "پیش‌فاکتور ارسال‌شده", customer: "دنا گروه بازرگانی", city: "تبریز", value: 260000000, ageDays: 55, daysSinceActivity: 20 },
  { stage: "چانه‌زنی نهایی", customer: "فردا تجهیزات تخصصی", city: "تهران", value: 320000000, ageDays: 20, daysSinceActivity: 1 },
  { stage: "چانه‌زنی نهایی", customer: "ایمان لجستیک", city: "مشهد", value: 400000000, ageDays: 90, daysSinceActivity: null },
];

async function main() {
  const owner = await prisma.user.findFirst({ where: { role: "owner" } });

  await prisma.deal.deleteMany({ where: { source: DEMO_SOURCE } });

  const now = Date.now();
  for (const item of DEALS) {
    const stage = await prisma.pipelineStage.findUniqueOrThrow({ where: { name: item.stage } });

    let contact = await prisma.contact.findFirst({ where: { name: item.customer } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: { name: item.customer, company: item.customer, city: item.city },
      });
    }

    const createdAt = new Date(now - item.ageDays * DAY);
    const deal = await prisma.deal.create({
      data: {
        title: `فروش به ${item.customer}`,
        value: item.value,
        contactId: contact.id,
        stageId: stage.id,
        ownerId: owner?.id,
        source: DEMO_SOURCE,
        createdAt,
        stageEnteredAt: createdAt,
      },
    });

    if (item.daysSinceActivity !== null) {
      await prisma.activity.create({
        data: {
          type: "call",
          content: "پیگیری فروش",
          dealId: deal.id,
          contactId: contact.id,
          ownerId: owner?.id,
          createdAt: new Date(now - item.daysSinceActivity * DAY),
        },
      });
    }
  }

  console.log(`Seeded ${DEALS.length} open demo deals.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
