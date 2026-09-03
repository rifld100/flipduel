import {
  calculatePnlPercent,
  comparePnl,
  createPnlState,
  processTrade,
  PREP_SECONDS,
  type TradeEvent,
} from "@flipduel/shared";
import {
  getRoom,
  getTrades,
  insertTrade,
  updateRoom,
  upsertDuel,
  recordLeaderboard,
  getActiveRooms,
} from "../db/queries.js";
import {
  fetchPumpTradesForWallet,
  getMintPriceSol,
} from "../pump/parser.js";
import {
  getBalance,
  getCurrentSlot,
  lamportsToSol,
  payoutTie,
  payoutWinner,
  refundCreator,
  solToLamports,
} from "../solana/client.js";

const pnlCache = new Map<
  string,
  { p1: number; p2: number; trades: TradeEvent[] }
>();

export async function pollDeposits() {
  const rooms = getActiveRooms();
  for (const room of rooms) {
    const stake = Math.floor(room.bank_lamports / 2);
    const balance = await getBalance(room.vault_pubkey);

    if (
      room.status === "awaiting_creator_deposit" &&
      balance >= stake &&
      !room.player1_deposited
    ) {
      updateRoom(room.id, {
        player1_deposited: 1,
        status: "open",
      });
    }

    if (
      room.status === "open" &&
      room.player2 &&
      balance >= room.bank_lamports &&
      !room.player2_deposited
    ) {
      updateRoom(room.id, {
        player1_deposited: 1,
        player2_deposited: 1,
        status: "matched",
      });
      startPrep(room.id);
    }
  }
}

export function startPrep(roomId: string) {
  const prepEnds = new Date(Date.now() + PREP_SECONDS * 1000).toISOString();
  updateRoom(roomId, {
    status: "prep",
    prep_ends_at: prepEnds,
  });
}

export async function startLiveIfReady(roomId: string) {
  const room = getRoom(roomId);
  if (!room || room.status !== "prep" || !room.prep_ends_at) return;
  if (new Date(room.prep_ends_at).getTime() > Date.now()) return;

  const slot = await getCurrentSlot();
  const durationMs = room.duration_min * 60 * 1000;
  const roundEnds = new Date(Date.now() + durationMs).toISOString();

  updateRoom(roomId, {
    status: "live",
    round_start_slot: slot,
    round_ends_at: roundEnds,
  });
}

export async function pollLiveDuels() {
  const rooms = getActiveRooms();
  for (const room of rooms) {
    if (room.status === "prep") {
      await startLiveIfReady(room.id);
      continue;
    }
    if (room.status !== "live" || !room.round_start_slot || !room.player2) {
      continue;
    }

    if (
      room.round_ends_at &&
      new Date(room.round_ends_at).getTime() <= Date.now()
    ) {
      await settleRoom(room.id);
      continue;
    }

    await syncTrades(room);
  }
}

async function syncTrades(room: {
  id: string;
  player1: string;
  player2: string | null;
  round_start_slot: number | null;
}) {
  if (!room.player2 || !room.round_start_slot) return;

  const minSlot = room.round_start_slot;
  const p1Trades = await fetchPumpTradesForWallet(room.player1, minSlot);
  const p2Trades = await fetchPumpTradesForWallet(room.player2, minSlot);

  for (const t of [...p1Trades, ...p2Trades]) {
    insertTrade({
      room_id: room.id,
      wallet: t.wallet,
      mint: t.mint,
      side: t.side,
      sol_lamports: t.solLamports,
      token_amount: t.tokenAmount,
      slot: t.slot,
      signature: t.signature,
    });
  }

  const p1Pct = await computePnl(room.id, room.player1);
  const p2Pct = await computePnl(room.id, room.player2);
  pnlCache.set(room.id, {
    p1: p1Pct,
    p2: p2Pct,
    trades: [...p1Trades, ...p2Trades],
  });
}

async function computePnl(roomId: string, wallet: string): Promise<number> {
  const rows = getTrades(roomId).filter((t) => t.wallet === wallet);
  let state = createPnlState();
  const mints = new Set<string>();

  for (const row of rows) {
    const trade: TradeEvent = {
      wallet: row.wallet,
      mint: row.mint,
      side: row.side as "buy" | "sell",
      solLamports: row.sol_lamports,
      tokenAmount: row.token_amount,
      slot: row.slot,
      signature: row.signature,
    };
    state = processTrade(state, trade);
    mints.add(row.mint);
  }

  const prices = new Map();
  for (const mint of mints) {
    const solPerToken = await getMintPriceSol(mint);
    if (solPerToken > 0) {
      prices.set(mint, {
        mint,
        solPerToken: solPerToken * 1e9 / 1e6,
        source: "pumpswap" as const,
      });
    }
  }

  return calculatePnlPercent(state, prices);
}

export async function settleRoom(roomId: string) {
  const room = getRoom(roomId);
  if (!room || !room.player2) return;

  updateRoom(roomId, { status: "settling" });

  const p1Pct = await computePnl(roomId, room.player1);
  const p2Pct = await computePnl(roomId, room.player2);
  const cmp = comparePnl(p1Pct, p2Pct);

  let winner: string | null = null;
  let result: "win" | "tie" = "tie";
  let settledTx: string | null = null;

  if (cmp === "tie") {
    settledTx = await payoutTie(
      roomId,
      room.player1,
      room.player2,
      Math.floor(room.bank_lamports / 2)
    );
    recordLeaderboard(room.player1, false, p1Pct);
    recordLeaderboard(room.player2, false, p2Pct);
  } else {
    result = "win";
    winner =
      cmp === "player1" ? room.player1 : room.player2;
    settledTx = await payoutWinner(roomId, winner, room.bank_lamports);
    recordLeaderboard(room.player1, cmp === "player1", p1Pct);
    recordLeaderboard(room.player2, cmp === "player2", p2Pct);
  }

  upsertDuel(roomId, {
    player1_pnl_pct: p1Pct,
    player2_pnl_pct: p2Pct,
    winner_wallet: winner,
    result,
    settled_tx: settledTx,
  });

  updateRoom(roomId, { status: "settled" });
}

export function getLivePnl(roomId: string) {
  return pnlCache.get(roomId) ?? { p1: 0, p2: 0, trades: [] };
}

export async function cancelRoomSearch(roomId: string, wallet: string) {
  const room = getRoom(roomId);
  if (!room) throw new Error("Room not found");
  if (room.player1 !== wallet) throw new Error("Not creator");
  if (room.player2_deposited) throw new Error("Cannot cancel");

  const tx = await refundCreator(
    roomId,
    room.player1,
    Math.floor(room.bank_lamports / 2)
  );
  updateRoom(roomId, { status: "cancelled" });
  return tx;
}

export function roomToResponse(room: NonNullable<ReturnType<typeof getRoom>>) {
  return {
    id: room.id,
    vaultAddress: room.vault_pubkey,
    bankSol: lamportsToSol(room.bank_lamports),
    depositSol: lamportsToSol(Math.floor(room.bank_lamports / 2)),
    durationMin: room.duration_min,
    player1: room.player1,
    player2: room.player2,
    status: room.status,
    player1Deposited: Boolean(room.player1_deposited),
    player2Deposited: Boolean(room.player2_deposited),
    prepEndsAt: room.prep_ends_at,
    roundEndsAt: room.round_ends_at,
    roundStartSlot: room.round_start_slot,
    createdAt: room.created_at,
  };
}
