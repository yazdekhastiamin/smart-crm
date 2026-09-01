import { getPipelineForecast, getForecastHistory } from "../services/forecastEngine.js";

export async function getForecast(req, res, next) {
  try {
    const forecast = await getPipelineForecast();
    res.json(forecast);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const days = req.query.days ? Number(req.query.days) : undefined;
    const history = await getForecastHistory(days);
    res.json(history);
  } catch (err) {
    next(err);
  }
}
