import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import flightsRoutes from "./routes/flights.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "flight-search-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/flights", flightsRoutes);

const port = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
