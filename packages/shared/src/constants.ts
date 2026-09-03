export const PUMP_BONDING_CURVE_PROGRAM_ID =
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_SWAP_PROGRAM_ID =
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

export const MIN_BANK_SOL = 0.05;
export const MIN_BUY_SOL = 0.2;
export const PREP_SECONDS = 30;
export const LAMPORTS_PER_SOL = 1_000_000_000;

export const DURATION_OPTIONS = [5, 15, 30] as const;
export type DurationMin = (typeof DURATION_OPTIONS)[number];

export const ROOM_STATUSES = [
  "awaiting_creator_deposit",
  "open",
  "matched",
  "prep",
  "live",
  "settling",
  "settled",
  "cancelled",
] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const DUEL_RESULTS = ["win", "tie"] as const;
export type DuelResult = (typeof DUEL_RESULTS)[number];

export const WALLET_CACHE_KEY = "flipduel_wallet";
