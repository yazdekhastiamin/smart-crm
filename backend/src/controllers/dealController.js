import { prisma } from "../config/prisma.js";
import { recalculateDealProbability } from "../services/forecastEngine.js";
import { getDealPriorityRanking } from "../services/priorityEngine.js";
import { buildDealInvoiceWorkbook, invoiceFileName } from "../services/dealInvoiceExport.js";

// رتبه‌بندی فرصت‌های باز برای «کدام لید را الان پیگیری کنم؟» (بخش ۳.۳ SPEC).
export async function getDealPriority(req, res, next) {
  try {
    const ranking = await getDealPriorityRanking();
    res.json(ranking);
  } catch (err) {
    next(err);
  }
}

export async function listDeals(req, res, next) {
  try {
    const deals = await prisma.deal.findMany({
      include: { contact: true, stage: true, owner: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
}

export async function getDeal(req, res, next) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        contact: true,
        stage: true,
        owner: true,
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function createDeal(req, res, next) {
  try {
    const {
      title,
      value,
      contactId,
      stageId,
      ownerId,
      source,
      industry,
      companySize,
      expectedCloseDate,
      itemDescription,
    } = req.body;
    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        contactId: Number(contactId),
        stageId: Number(stageId),
        ownerId: ownerId ? Number(ownerId) : undefined,
        source,
        industry,
        companySize,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        itemDescription,
      },
    });
    // probability را همان لحظه بر اساس مرحله و سیگنال‌ها محاسبه و ذخیره می‌کند.
    const scored = await recalculateDealProbability(deal.id);
    res.status(201).json(scored);
  } catch (err) {
    next(err);
  }
}

// تغییر مرحله معامله. اگر مرحله‌ی مقصد برد/باخت باشد، status و probability
// نهایی می‌شوند؛ در غیر این صورت probability دوباره توسط forecastEngine
// محاسبه می‌شود. stageEnteredAt هم ریست می‌شود تا سیگنال «سرعت پیشرفت بین
// مراحل» (بخش ۳.۱ SPEC) بعداً از این تاریخ محاسبه شود.
export async function updateDealStage(req, res, next) {
  try {
    const stageId = Number(req.body.stageId);
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) return res.status(404).json({ error: "Stage not found" });

    const status = stage.isWon ? "won" : stage.isLost ? "lost" : "open";

    await prisma.deal.update({
      where: { id: Number(req.params.id) },
      data: {
        stageId,
        status,
        stageEnteredAt: new Date(),
        ...(status !== "open" ? { probability: stage.isWon ? 1 : 0 } : {}),
      },
    });

    const dealId = Number(req.params.id);
    const deal =
      status === "open"
        ? await recalculateDealProbability(dealId)
        : await prisma.deal.findUnique({
            where: { id: dealId },
            include: { contact: true, stage: true, owner: true },
          });

    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function updateDeal(req, res, next) {
  try {
    // status/probability فقط از طریق تغییر مرحله (updateDealStage) نهایی
    // می‌شوند، نه این endpoint — تا با آن منطق ناسازگار نشوند. با این حال
    // چون سن معامله (که در محاسبه‌ی probability اثر دارد) با گذر زمان تغییر
    // می‌کند، بعد از هر ویرایش probability دوباره محاسبه می‌شود.
    const { title, value, ownerId, source, industry, companySize, expectedCloseDate, itemDescription } =
      req.body;
    const dealId = Number(req.params.id);
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        title,
        value,
        ownerId: ownerId === null ? null : ownerId ? Number(ownerId) : undefined,
        source,
        industry,
        companySize,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        itemDescription,
      },
    });

    const deal = await recalculateDealProbability(dealId);
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

// خروجی پیش‌فاکتور Excel برای یک Deal مشخص — لایه اتصال مالی (بخش SPEC)،
// فرمت ساده و عمومی برای import دستی به هر نرم‌افزار مالی.
export async function exportDealInvoice(req, res, next) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: Number(req.params.id) },
      include: { contact: true },
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const workbook = await buildDealInvoiceWorkbook(deal);
    const fileName = invoiceFileName(deal.id);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${deal.id}.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function deleteDeal(req, res, next) {
  try {
    await prisma.deal.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
