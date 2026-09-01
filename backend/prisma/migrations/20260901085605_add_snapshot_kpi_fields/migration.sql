-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ForecastSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalForecast" REAL NOT NULL,
    "openDealsCount" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL DEFAULT 0,
    "avgCycleDays" REAL NOT NULL DEFAULT 0,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ForecastSnapshot" ("createdAt", "date", "id", "openDealsCount", "totalForecast") SELECT "createdAt", "date", "id", "openDealsCount", "totalForecast" FROM "ForecastSnapshot";
DROP TABLE "ForecastSnapshot";
ALTER TABLE "new_ForecastSnapshot" RENAME TO "ForecastSnapshot";
CREATE UNIQUE INDEX "ForecastSnapshot_date_key" ON "ForecastSnapshot"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
