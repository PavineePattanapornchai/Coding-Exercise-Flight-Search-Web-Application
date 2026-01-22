import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  fetchStats,
  fetchCallsign,
  fetchAircraft,
  fetchAirline
} from "../services/adsbdb.js";

const router = express.Router();

router.use(requireAuth);

const statsCache = {
  value: null,
  expiresAt: 0
};

router.get("/stats", async (req, res) => {
  try {
    const now = Date.now();
    if (statsCache.value && statsCache.expiresAt > now) {
      return res.json(statsCache.value);
    }

    const data = await fetchStats();
    const daily = data?.response?.daily ?? {};

    const mapItems = (items = [], type) =>
      items
        .filter((item) => item?.url && item?.url !== "/v0/callsign/unknown")
        .map((item) => {
          const parts = item.url.split("/");
          const query = parts[parts.length - 1];
          return { type, query, count: item.count };
        });

    const payload = {
      popular: {
        callsign: mapItems(daily.callsign, "callsign"),
        aircraft: mapItems(daily.aircraft, "aircraft"),
        airline: mapItems(daily.airline, "airline")
      }
    };

    statsCache.value = payload;
    statsCache.expiresAt = now + 5 * 60 * 1000;

    return res.json(payload);
  } catch (err) {
    return res.status(502).json({ message: "Failed to fetch stats" });
  }
});

router.get("/search", async (req, res) => {
  const query = (req.query.query || "").trim();
  const type = (req.query.type || "").trim();

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    let data;
    let resolvedType = type;

    if (!resolvedType) {
      if (query.length === 3) resolvedType = "airline";
      else if (/^[A-Za-z0-9]{6}$/.test(query)) resolvedType = "aircraft";
      else resolvedType = "callsign";
    }

    if (resolvedType === "callsign") {
      data = await fetchCallsign(query);
    } else if (resolvedType === "aircraft") {
      data = await fetchAircraft(query);
    } else if (resolvedType === "airline") {
      data = await fetchAirline(query);
    } else {
      return res.status(400).json({ message: "Unsupported search type" });
    }

    if (typeof data?.response === "string" && data.response.startsWith("unknown")) {
      return res.status(404).json({ message: "No data found" });
    }

    return res.json({ ok: true, type: resolvedType, data: data.response });
  } catch (err) {
    return res.status(502).json({ message: "Failed to fetch search result" });
  }
});

export default router;
