-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalForecast" REAL NOT NULL,
    "openDealsCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ForecastSnapshot_date_key" ON "ForecastSnapshot"("date");
