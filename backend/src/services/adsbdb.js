import axios from "axios";
import { config } from "../lib/config.js";

const client = axios.create({
  baseURL: config.adsbdbBaseUrl,
  timeout: 10000
});

export async function fetchStats() {
  const response = await client.get("/stats");
  return response.data;
}

export async function fetchCallsign(callsign) {
  const response = await client.get(`/callsign/${encodeURIComponent(callsign)}`);
  return response.data;
}

export async function fetchAircraft(query) {
  const response = await client.get(`/aircraft/${encodeURIComponent(query)}`);
  return response.data;
}

export async function fetchAirline(code) {
  const response = await client.get(`/airline/${encodeURIComponent(code)}`);
  return response.data;
}
