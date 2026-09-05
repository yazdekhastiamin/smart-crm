// معاملات بسته‌شده‌ی تاریخی را از یک فایل xlsx وارد دیتابیس می‌کند تا
// forecastEngine (میانگین چرخه‌ی فروش) روی داده‌ی واقع‌گرایانه کار کند،
// نه فقط مقدار پیش‌فرض DEFAULT_CYCLE_DAYS.
//
// اجرا: npm run import:sample-deals -- [مسیر فایل xlsx]
// پیش‌فرض مسیر: prisma/data/sample_deals_30.xlsx

import path from "node:path";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { samplePhoneFor } from "./seedHelpers.js";

const prisma = new PrismaClient();
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// معاملات ۳۰ روزه‌ی نمونه را روی بازه‌ی ۶ ماه گذشته پخش می‌کند تا میانگین
// چرخه‌ی فروش از یک خوشه‌ی تاریخی تکی حساب نشود.
const SPREAD_DAYS = 180;

function parseRow(row) {
  return {
    customerName: String(row["نام مشتری"]).trim(),
    industry: String(row["بخش/نوع کسب‌وکار"]).trim(),
    city: String(row["شهر"]).trim(),
    source: String(row["منبع لید"]).trim(),
    repName: String(row["کارشناس فروش"]).trim(),
    value: Number(row["ارزش معامله (تومان)"]),
    cycleDays: Number(row["طول چرخه فروش (روز)"]),
    won: String(row["وضعیت نهایی"]).trim() === "برد",
    lossReason: row["علت باخت (در صورت باخت)"] ? String(row["علت باخت (در صورت باخت)"]).trim() : null,
  };
}

async function readRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const headers = sheet.getRow(1).values.slice(1).map((h) => String(h).trim());

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    const record = {};
    headers.forEach((header, i) => (record[header] = values[i]));
    rows.push(parseRow(record));
  });
  return rows;
}

async function getOrCreateRep(name) {
  const email = `${name.replace(/\s+/g, ".")}@demo.local`;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role: "sales_rep" },
  });
}

async function getOrCreateContact({ customerName, industry, city }) {
  const existing = await prisma.contact.findFirst({ where: { name: customerName } });
  if (existing) {
    if (existing.phone) return existing;
    return prisma.contact.update({
      where: { id: existing.id },
      data: { phone: samplePhoneFor(customerName) },
    });
  }
  return prisma.contact.create({
    data: { name: customerName, company: customerName, position: industry, city, phone: samplePhoneFor(customerName) },
  });
}

async function main() {
  const filePath = path.resolve(process.argv[2] || "prisma/data/sample_deals_30.xlsx");
  const rows = await readRows(filePath);
  console.log(`Read ${rows.length} historical deals from ${filePath}`);

  const wonStage = await prisma.pipelineStage.findFirst({ where: { isWon: true } });
  const lostStage = await prisma.pipelineStage.findFirst({ where: { isLost: true } });
  if (!wonStage || !lostStage) {
    throw new Error("Won/lost pipeline stages not found — run `npm run seed` first.");
  }

  const now = new Date();
  const step = SPREAD_DAYS / rows.length;

  let created = 0;
  for (const [index, row] of rows.entries()) {
    const rep = await getOrCreateRep(row.repName);
    const contact = await getOrCreateContact(row);

    // شناسه‌های کوچک‌تر = قدیمی‌تر؛ روی ۶ ماه گذشته پخش می‌شوند.
    const closedAt = new Date(now.getTime() - (rows.length - 1 - index) * step * MS_PER_DAY);
    const createdAt = new Date(closedAt.getTime() - row.cycleDays * MS_PER_DAY);
    const stage = row.won ? wonStage : lostStage;

    const deal = await prisma.deal.create({
      data: {
        title: `فروش به ${row.customerName}`,
        value: row.value,
        status: row.won ? "won" : "lost",
        probability: row.won ? 1 : 0,
        source: row.source,
        industry: row.industry,
        contactId: contact.id,
        stageId: stage.id,
        ownerId: rep.id,
        createdAt,
        updatedAt: closedAt,
        stageEnteredAt: closedAt,
      },
    });

    if (!row.won && row.lossReason) {
      await prisma.activity.create({
        data: {
          type: "note",
          content: `علت باخت: ${row.lossReason}`,
          completed: true,
          dealId: deal.id,
          contactId: contact.id,
          ownerId: rep.id,
          createdAt: closedAt,
        },
      });
    }

    created += 1;
  }

  console.log(`Imported ${created} historical deals (won/lost).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
