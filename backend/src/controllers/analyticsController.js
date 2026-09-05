import { getWinPatternAnalysis } from "../services/winPatternAnalysis.js";

export async function getWinPatterns(req, res, next) {
  try {
    const analysis = await getWinPatternAnalysis();
    res.json(analysis);
  } catch (err) {
    next(err);
  }
}
