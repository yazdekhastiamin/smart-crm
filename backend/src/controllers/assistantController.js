import { runAssistantChat } from "../services/aiAssistant.js";

export async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "پیام نمی‌تواند خالی باشد." });
    }
    const result = await runAssistantChat({ message: message.trim(), history });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
