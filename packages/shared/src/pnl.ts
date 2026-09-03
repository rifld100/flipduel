import { MIN_BUY_SOL } from "./constants.js";
import type { MintPrice, TradeEvent } from "./types.js";

export interface Lot {
  mint: string;
  tokenAmount: number;
  solCostLamports: number;
}

export interface PnlState {
  lots: Lot[];
  solInLamports: number;
  solOutLamports: number;
}

export function createPnlState(): PnlState {
  return { lots: [], solInLamports: 0, solOutLamports: 0 };
}

export function isQualifyingBuy(solLamports: number): boolean {
  const minLamports = MIN_BUY_SOL * 1_000_000_000;
  return solLamports >= minLamports;
}

export function applyBuy(state: PnlState, trade: TradeEvent): PnlState {
  if (!isQualifyingBuy(trade.solLamports)) {
    return state;
  }
  return {
    lots: [
      ...state.lots,
      {
        mint: trade.mint,
        tokenAmount: trade.tokenAmount,
        solCostLamports: trade.solLamports,
      },
    ],
    solInLamports: state.solInLamports + trade.solLamports,
    solOutLamports: state.solOutLamports,
  };
}

export function applySell(state: PnlState, trade: TradeEvent): PnlState {
  let remaining = trade.tokenAmount;
  let solOut = trade.solLamports;
  const lots = [...state.lots];

  for (let i = 0; i < lots.length && remaining > 0; i++) {
    const lot = lots[i];
    if (lot.mint !== trade.mint) continue;
    const take = Math.min(lot.tokenAmount, remaining);
    lot.tokenAmount -= take;
    remaining -= take;
    if (lot.tokenAmount <= 0) {
      lots.splice(i, 1);
      i--;
    }
  }

  return {
    lots,
    solInLamports: state.solInLamports,
    solOutLamports: state.solOutLamports + solOut,
  };
}

export function mtmRemainderLamports(
  lots: Lot[],
  prices: Map<string, MintPrice>
): number {
  let total = 0;
  for (const lot of lots) {
    const price = prices.get(lot.mint);
    if (!price || price.solPerToken <= 0) continue;
    total += Math.floor(lot.tokenAmount * price.solPerToken);
  }
  return total;
}

export function calculatePnlPercent(
  state: PnlState,
  prices: Map<string, MintPrice> = new Map()
): number {
  if (state.solInLamports === 0) return 0;
  const inventory = mtmRemainderLamports(state.lots, prices);
  const solOut = state.solOutLamports + inventory;
  return ((solOut / state.solInLamports - 1) * 100);
}

export function processTrade(state: PnlState, trade: TradeEvent): PnlState {
  if (trade.side === "buy") return applyBuy(state, trade);
  return applySell(state, trade);
}

export function comparePnl(p1: number, p2: number): "player1" | "player2" | "tie" {
  const diff = p1 - p2;
  if (Math.abs(diff) < 0.0001) return "tie";
  return p1 > p2 ? "player1" : "player2";
}
