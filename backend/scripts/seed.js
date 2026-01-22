import bcrypt from "bcryptjs";
import { initDb, getDb } from "../src/lib/db.js";

const email = "test@example.com";
const password = "password123";

async function seed() {
  await initDb();
  const db = await getDb();

  const existing = await db.get("SELECT id FROM users WHERE email = ?", email);
  if (existing) {
    console.log("Seed user already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", email, passwordHash);

  console.log("Seed user created:", email);
}

seed().catch((err) => {
  console.error("Failed to seed user", err);
  process.exit(1);
});
