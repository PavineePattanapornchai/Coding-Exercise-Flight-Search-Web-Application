export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-me",
  dbPath: process.env.DB_PATH || "./data/app.db",
  adsbdbBaseUrl: process.env.ADSBDB_BASE_URL || "https://api.adsbdb.com/v0"
};
