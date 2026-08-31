import { getPipelineForecast } from "../services/forecastEngine.js";

export async function getForecast(req, res, next) {
  try {
    const forecast = await getPipelineForecast();
    res.json(forecast);
  } catch (err) {
    next(err);
  }
}
