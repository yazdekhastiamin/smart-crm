import { prisma } from "../config/prisma.js";
import { recalculateDealProbability } from "../services/forecastEngine.js";

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
      include: { contact: true, stage: true, owner: true, activities: true },
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function createDeal(req, res, next) {
  try {
    const { title, value, contactId, stageId, ownerId, source, industry, companySize, expectedCloseDate } =
      req.body;
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

    const deal =
      status === "open"
        ? await recalculateDealProbability(Number(req.params.id))
        : await prisma.deal.findUnique({ where: { id: Number(req.params.id) }, include: { stage: true } });

    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function updateDeal(req, res, next) {
  try {
    // probability/status از طریق تغییر مرحله (updateDealStage) مدیریت می‌شوند،
    // نه این endpoint — تا با محاسبه‌ی forecastEngine ناسازگار نشوند.
    const { title, value, source, industry, companySize, expectedCloseDate } = req.body;
    const deal = await prisma.deal.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        value,
        source,
        industry,
        companySize,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      },
    });
    res.json(deal);
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
