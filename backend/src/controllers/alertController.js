import { getFollowUpAlerts } from "../services/alertEngine.js";

export async function listAlerts(req, res, next) {
  try {
    const alerts = await getFollowUpAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}
