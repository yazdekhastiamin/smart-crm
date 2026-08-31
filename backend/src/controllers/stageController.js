import { prisma } from "../config/prisma.js";

export async function listStages(req, res, next) {
  try {
    const stages = await prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
    res.json(stages);
  } catch (err) {
    next(err);
  }
}
