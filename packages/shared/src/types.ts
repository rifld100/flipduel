import { z } from "zod";
import { DURATION_OPTIONS } from "./constants.js";

export const createRoomSchema = z.object({
  wallet: z.string().min(32).max(44),
  bankSol: z.number().min(0.05),
  durationMin: z.union([z.literal(5), z.literal(15), z.literal(30)]),
});

export const joinRoomSchema = z.object({
  wallet: z.string().min(32).max(44),
});

export const walletSchema = z.object({
  wallet: z.string().min(32).max(44),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export interface TradeEvent {
  wallet: string;
  mint: string;
  side: "buy" | "sell";
  solLamports: number;
  tokenAmount: number;
  slot: number;
  signature: string;
}

export interface MintPrice {
  mint: string;
  solPerToken: number;
  source: "bonding_curve" | "pumpswap";
}

export interface RoomResponse {
  id: string;
  vaultAddress: string;
  bankSol: number;
  depositSol: number;
  durationMin: number;
  player1: string;
  player2: string | null;
  status: string;
  player1Deposited: boolean;
  player2Deposited: boolean;
  prepEndsAt: string | null;
  roundEndsAt: string | null;
  roundStartSlot: number | null;
  createdAt: string;
}

export interface DuelState {
  roomId: string;
  status: string;
  player1: string;
  player2: string;
  bankSol: number;
  prepEndsAt: string | null;
  roundEndsAt: string | null;
  roundStartSlot: number | null;
  player1PnlPct: number;
  player2PnlPct: number;
  winner: string | null;
  result: string | null;
}

export interface LeaderboardEntry {
  wallet: string;
  wins: number;
  matches: number;
  winrate: number;
  bestPnlPct: number;
}
