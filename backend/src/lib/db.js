import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { promises as fs } from "fs";
import path from "path";
import { config } from "./config.js";

let dbInstance;

async function ensureDbDirectory() {
  const dbPath = config.dbPath;
  const dir = path.dirname(dbPath);
  if (dir && dir !== ".") {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function getDb() {
  if (!dbInstance) {
    await ensureDbDirectory();
    dbInstance = await open({
      filename: config.dbPath,
      driver: sqlite3.Database
    });
  }

  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
