import { prisma } from "../config/prisma.js";

export async function listActivities(req, res, next) {
  try {
    const { contactId, dealId } = req.query;
    const activities = await prisma.activity.findMany({
      where: {
        contactId: contactId ? Number(contactId) : undefined,
        dealId: dealId ? Number(dealId) : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
}

export async function createActivity(req, res, next) {
  try {
    const { type, content, dueDate, contactId, dealId, ownerId } = req.body;
    const activity = await prisma.activity.create({
      data: {
        type,
        content,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        contactId: contactId ? Number(contactId) : undefined,
        dealId: dealId ? Number(dealId) : undefined,
        ownerId: ownerId ? Number(ownerId) : undefined,
      },
    });
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
}

export async function updateActivity(req, res, next) {
  try {
    const { content, dueDate, completed } = req.body;
    const activity = await prisma.activity.update({
      where: { id: Number(req.params.id) },
      data: {
        content,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completed,
      },
    });
    res.json(activity);
  } catch (err) {
    next(err);
  }
}

export async function deleteActivity(req, res, next) {
  try {
    await prisma.activity.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
