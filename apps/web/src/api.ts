import { WALLET_CACHE_KEY } from "@flipduel/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export function getCachedWallet(): string | null {
  return localStorage.getItem(WALLET_CACHE_KEY);
}

export function setCachedWallet(wallet: string) {
  localStorage.setItem(WALLET_CACHE_KEY, wallet);
}

export function clearCachedWallet() {
  localStorage.removeItem(WALLET_CACHE_KEY);
}

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export interface Room {
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

export function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
