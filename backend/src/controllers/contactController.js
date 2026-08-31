import { prisma } from "../config/prisma.js";

export async function listContacts(req, res, next) {
  try {
    const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
    res.json(contacts);
  } catch (err) {
    next(err);
  }
}

export async function getContact(req, res, next) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: Number(req.params.id) },
      include: { deals: true, activities: true },
    });
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function createContact(req, res, next) {
  try {
    const { name, company, position, email, phone, notes } = req.body;
    const contact = await prisma.contact.create({
      data: { name, company, position, email, phone, notes },
    });
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
}

export async function updateContact(req, res, next) {
  try {
    const { name, company, position, email, phone, notes } = req.body;
    const contact = await prisma.contact.update({
      where: { id: Number(req.params.id) },
      data: { name, company, position, email, phone, notes },
    });
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req, res, next) {
  try {
    await prisma.contact.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
