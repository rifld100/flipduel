import "dotenv/config";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DATABASE_PATH ?? join(dataDir, "flipduel.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_id_u64 INTEGER NOT NULL UNIQUE,
      vault_pubkey TEXT NOT NULL,
      bank_lamports INTEGER NOT NULL,
      duration_min INTEGER NOT NULL,
      player1 TEXT NOT NULL,
      player2 TEXT,
      status TEXT NOT NULL,
      player1_deposited INTEGER NOT NULL DEFAULT 0,
      player2_deposited INTEGER NOT NULL DEFAULT 0,
      prep_ends_at TEXT,
      round_ends_at TEXT,
      round_start_slot INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS duels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL UNIQUE REFERENCES rooms(id),
      player1_pnl_pct REAL,
      player2_pnl_pct REAL,
      winner_wallet TEXT,
      result TEXT,
      settled_tx TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL REFERENCES rooms(id),
      wallet TEXT NOT NULL,
      mint TEXT NOT NULL,
      side TEXT NOT NULL,
      sol_lamports INTEGER NOT NULL,
      token_amount REAL NOT NULL,
      slot INTEGER NOT NULL,
      signature TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leaderboard_stats (
      wallet TEXT PRIMARY KEY,
      wins INTEGER NOT NULL DEFAULT 0,
      matches INTEGER NOT NULL DEFAULT 0,
      best_pnl_pct REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS room_vault_keys (
      room_id TEXT PRIMARY KEY REFERENCES rooms(id),
      secret_key_base64 TEXT NOT NULL
    );
  `);
}
