import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import {
  createRoomSchema,
  joinRoomSchema,
  MIN_BANK_SOL,
} from "@flipduel/shared";
import { migrate } from "./db/index.js";
import {
  getRoom,
  insertRoom,
  listRooms,
  updateRoom,
  getLeaderboard,
  getTrades,
  getDuel,
} from "./db/queries.js";
import {
  cancelRoomSearch,
  getLivePnl,
  pollDeposits,
  pollLiveDuels,
  roomToResponse,
} from "./services/duel.js";
import {
  createVaultForRoom,
  lamportsToSol,
  solToLamports,
} from "./solana/client.js";
import { randomUUID } from "crypto";

migrate();

const app = new Hono();
app.use("*", cors());

let roomIdCounter = Date.now();

app.get("/health", (c) => c.json({ ok: true, service: "flipduel-api" }));

app.get("/rooms", (c) => {
  const status = c.req.query("status");
  const durationMin = c.req.query("durationMin");
  const bankMin = c.req.query("bankMin");
  const bankMax = c.req.query("bankMax");

  const rooms = listRooms({
    status: status ?? undefined,
    durationMin: durationMin ? Number(durationMin) : undefined,
    bankMinSol: bankMin ? Number(bankMin) : undefined,
    bankMaxSol: bankMax ? Number(bankMax) : undefined,
  });

  return c.json(rooms.map(roomToResponse));
});

app.post("/rooms", async (c) => {
  const body = await c.req.json();
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { wallet, bankSol, durationMin } = parsed.data;
  if (bankSol < MIN_BANK_SOL) {
    return c.json({ error: "Min bank is 0.05 SOL" }, 400);
  }

  const id = randomUUID();
  const roomIdU64 = roomIdCounter++;
  const vaultPubkey = createVaultForRoom(id).toBase58();
  const bankLamports = solToLamports(bankSol);

  insertRoom({
    id,
    room_id_u64: roomIdU64,
    vault_pubkey: vaultPubkey,
    bank_lamports: bankLamports,
    duration_min: durationMin,
    player1: wallet,
    player2: null,
    status: "awaiting_creator_deposit",
    player1_deposited: 0,
    player2_deposited: 0,
    prep_ends_at: null,
    round_ends_at: null,
    round_start_slot: null,
  });

  return c.json(roomToResponse(getRoom(id)!));
});

app.get("/rooms/:id", (c) => {
  const room = getRoom(c.req.param("id"));
  if (!room) return c.json({ error: "Not found" }, 404);
  return c.json(roomToResponse(room));
});

app.post("/rooms/:id/join", async (c) => {
  const body = await c.req.json();
  const parsed = joinRoomSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const room = getRoom(c.req.param("id"));
  if (!room) return c.json({ error: "Not found" }, 404);
  if (room.status !== "open") {
    return c.json({ error: "Room not joinable" }, 400);
  }
  if (parsed.data.wallet === room.player1) {
    return c.json({ error: "Cannot join own room" }, 400);
  }

  updateRoom(room.id, { player2: parsed.data.wallet });
  return c.json(roomToResponse(getRoom(room.id)!));
});

app.post("/rooms/:id/cancel", async (c) => {
  const body = await c.req.json();
  const wallet = body.wallet as string;
  try {
    const tx = await cancelRoomSearch(c.req.param("id"), wallet);
    return c.json({ ok: true, tx });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

app.get("/duels/:roomId", (c) => {
  const room = getRoom(c.req.param("roomId"));
  if (!room) return c.json({ error: "Not found" }, 404);

  const pnl = getLivePnl(room.id);
  const duel = getDuel(room.id);

  return c.json({
    roomId: room.id,
    status: room.status,
    player1: room.player1,
    player2: room.player2,
    bankSol: lamportsToSol(room.bank_lamports),
    prepEndsAt: room.prep_ends_at,
    roundEndsAt: room.round_ends_at,
    roundStartSlot: room.round_start_slot,
    player1PnlPct: pnl.p1,
    player2PnlPct: pnl.p2,
    winner: duel ? (duel as { winner_wallet: string }).winner_wallet : null,
    result: duel ? (duel as { result: string }).result : null,
  });
});

app.get("/duels/:roomId/trades", (c) => {
  const trades = getTrades(c.req.param("roomId"));
  return c.json(trades);
});

app.get("/leaderboard", (c) => {
  const limit = Number(c.req.query("limit") ?? 50);
  return c.json(getLeaderboard(limit));
});

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Flipduel API http://localhost:${port}`);
});

setInterval(() => {
  pollDeposits().catch(console.error);
  pollLiveDuels().catch(console.error);
}, 5000);
