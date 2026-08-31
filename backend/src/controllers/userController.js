import { prisma } from "../config/prisma.js";

export async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    res.json(users);
  } catch (err) {
    next(err);
  }
}
