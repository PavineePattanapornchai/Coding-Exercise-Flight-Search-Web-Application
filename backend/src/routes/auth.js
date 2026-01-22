import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../lib/db.js";
import { config } from "../lib/config.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const db = await getDb();
    const existing = await db.get("SELECT id FROM users WHERE email = ?", email);

    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      email,
      passwordHash
    );

    const token = jwt.sign({ userId: result.lastID, email }, config.jwtSecret, {
      expiresIn: "1h"
    });

    return res.status(201).json({ token, user: { id: result.lastID, email } });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const db = await getDb();
    const user = await db.get(
      "SELECT id, email, password_hash FROM users WHERE email = ?",
      email
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "Account not found. Please register." });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: "1h"
    });

    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

export default router;
