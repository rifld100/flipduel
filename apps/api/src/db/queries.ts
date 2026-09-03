import { db } from "./index.js";

export interface RoomRow {
  id: string;
  room_id_u64: number;
  vault_pubkey: string;
  bank_lamports: number;
  duration_min: number;
  player1: string;
  player2: string | null;
  status: string;
  player1_deposited: number;
  player2_deposited: number;
  prep_ends_at: string | null;
  round_ends_at: string | null;
  round_start_slot: number | null;
  created_at: string;
}

export function getRoom(id: string): RoomRow | undefined {
  return db.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as
    | RoomRow
    | undefined;
}

export function listRooms(filters: {
  status?: string;
  durationMin?: number;
  bankMinSol?: number;
  bankMaxSol?: number;
}): RoomRow[] {
  let sql = "SELECT * FROM rooms WHERE 1=1";
  const params: unknown[] = [];

  if (filters.status) {
    sql += " AND status = ?";
    params.push(filters.status);
  }
  if (filters.durationMin) {
    sql += " AND duration_min = ?";
    params.push(filters.durationMin);
  }
  if (filters.bankMinSol) {
    sql += " AND bank_lamports >= ?";
    params.push(Math.floor(filters.bankMinSol * 1e9));
  }
  if (filters.bankMaxSol) {
    sql += " AND bank_lamports <= ?";
    params.push(Math.floor(filters.bankMaxSol * 1e9));
  }

  sql += " ORDER BY created_at DESC LIMIT 100";
  return db.prepare(sql).all(...params) as RoomRow[];
}

export function insertRoom(row: Omit<RoomRow, "created_at">) {
  db.prepare(
    `INSERT INTO rooms (
      id, room_id_u64, vault_pubkey, bank_lamports, duration_min,
      player1, player2, status, player1_deposited, player2_deposited,
      prep_ends_at, round_ends_at, round_start_slot
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    row.room_id_u64,
    row.vault_pubkey,
    row.bank_lamports,
    row.duration_min,
    row.player1,
    row.player2,
    row.status,
    row.player1_deposited,
    row.player2_deposited,
    row.prep_ends_at,
    row.round_ends_at,
    row.round_start_slot
  );
}

export function updateRoom(
  id: string,
  patch: Partial<RoomRow>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k === "id") continue;
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
}

export function insertTrade(trade: {
  room_id: string;
  wallet: string;
  mint: string;
  side: string;
  sol_lamports: number;
  token_amount: number;
  slot: number;
  signature: string;
}) {
  db.prepare(
    `INSERT OR IGNORE INTO trades (room_id, wallet, mint, side, sol_lamports, token_amount, slot, signature)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    trade.room_id,
    trade.wallet,
    trade.mint,
    trade.side,
    trade.sol_lamports,
    trade.token_amount,
    trade.slot,
    trade.signature
  );
}

export interface TradeRow {
  room_id: string;
  wallet: string;
  mint: string;
  side: string;
  sol_lamports: number;
  token_amount: number;
  slot: number;
  signature: string;
}

export function getTrades(roomId: string): TradeRow[] {
  return db
    .prepare("SELECT * FROM trades WHERE room_id = ? ORDER BY slot ASC")
    .all(roomId) as TradeRow[];
}

export function upsertDuel(
  roomId: string,
  data: {
    player1_pnl_pct: number;
    player2_pnl_pct: number;
    winner_wallet: string | null;
    result: string;
    settled_tx: string | null;
  }
) {
  db.prepare(
    `INSERT INTO duels (room_id, player1_pnl_pct, player2_pnl_pct, winner_wallet, result, settled_tx)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(room_id) DO UPDATE SET
       player1_pnl_pct = excluded.player1_pnl_pct,
       player2_pnl_pct = excluded.player2_pnl_pct,
       winner_wallet = excluded.winner_wallet,
       result = excluded.result,
       settled_tx = excluded.settled_tx`
  ).run(
    roomId,
    data.player1_pnl_pct,
    data.player2_pnl_pct,
    data.winner_wallet,
    data.result,
    data.settled_tx
  );
}

export function getDuel(roomId: string) {
  return db
    .prepare("SELECT * FROM duels WHERE room_id = ?")
    .get(roomId);
}

export function recordLeaderboard(
  wallet: string,
  won: boolean,
  pnlPct: number
) {
  const row = db
    .prepare("SELECT * FROM leaderboard_stats WHERE wallet = ?")
    .get(wallet) as { wins: number; matches: number; best_pnl_pct: number } | undefined;

  if (!row) {
    db.prepare(
      `INSERT INTO leaderboard_stats (wallet, wins, matches, best_pnl_pct) VALUES (?, ?, 1, ?)`
    ).run(wallet, won ? 1 : 0, pnlPct);
    return;
  }

  const best = Math.max(row.best_pnl_pct, pnlPct);
  db.prepare(
    `UPDATE leaderboard_stats SET wins = wins + ?, matches = matches + 1, best_pnl_pct = ? WHERE wallet = ?`
  ).run(won ? 1 : 0, best, wallet);
}

export function getLeaderboard(limit = 50) {
  return db
    .prepare(
      `SELECT wallet, wins, matches,
        CASE WHEN matches > 0 THEN CAST(wins AS REAL) / matches ELSE 0 END as winrate,
        best_pnl_pct
       FROM leaderboard_stats ORDER BY wins DESC, best_pnl_pct DESC LIMIT ?`
    )
    .all(limit);
}

export function storeVaultKey(roomId: string, secretKeyBase64: string) {
  db.prepare(
    `INSERT OR REPLACE INTO room_vault_keys (room_id, secret_key_base64) VALUES (?, ?)`
  ).run(roomId, secretKeyBase64);
}

export function getVaultKey(roomId: string): string | undefined {
  const row = db
    .prepare("SELECT secret_key_base64 FROM room_vault_keys WHERE room_id = ?")
    .get(roomId) as { secret_key_base64: string } | undefined;
  return row?.secret_key_base64;
}

export function getActiveRooms(): RoomRow[] {
  return db
    .prepare(
      `SELECT * FROM rooms WHERE status IN ('open', 'matched', 'prep', 'live', 'awaiting_creator_deposit')`
    )
    .all() as RoomRow[];
}
