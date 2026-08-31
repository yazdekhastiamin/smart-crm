import { prisma } from "../config/prisma.js";

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
    const {
      title,
      value,
      contactId,
      stageId,
      ownerId,
      probability,
      source,
      industry,
      companySize,
      expectedCloseDate,
    } = req.body;
    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        contactId: Number(contactId),
        stageId: Number(stageId),
        ownerId: ownerId ? Number(ownerId) : undefined,
        probability,
        source,
        industry,
        companySize,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      },
    });
    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
}

// تغییر مرحله معامله؛ stageEnteredAt را ریست می‌کند تا سیگنال «سرعت
// پیشرفت بین مراحل» (بخش ۳.۱ SPEC) بعداً از این تاریخ محاسبه شود.
export async function updateDealStage(req, res, next) {
  try {
    const { stageId } = req.body;
    const deal = await prisma.deal.update({
      where: { id: Number(req.params.id) },
      data: { stageId: Number(stageId), stageEnteredAt: new Date() },
    });
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function updateDeal(req, res, next) {
  try {
    const { title, value, probability, source, industry, companySize, expectedCloseDate, status } =
      req.body;
    const deal = await prisma.deal.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        value,
        probability,
        source,
        industry,
        companySize,
        status,
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
