import { describe, expect, it } from "vitest";
import {
  applyBuy,
  applySell,
  calculatePnlPercent,
  createPnlState,
  comparePnl,
} from "./pnl.js";

const LAMPORTS = 1_000_000_000;

describe("pnl", () => {
  it("canonical example: 1+0.5+2 in, 1.5+1+1 out = 0%", () => {
    let state = createPnlState();
    state = applyBuy(state, {
      wallet: "w",
      mint: "a",
      side: "buy",
      solLamports: 1 * LAMPORTS,
      tokenAmount: 10_000_000,
      slot: 1,
      signature: "s1",
    });
    state = applyBuy(state, {
      wallet: "w",
      mint: "b",
      side: "buy",
      solLamports: 0.5 * LAMPORTS,
      tokenAmount: 5_000_000,
      slot: 2,
      signature: "s2",
    });
    state = applyBuy(state, {
      wallet: "w",
      mint: "c",
      side: "buy",
      solLamports: 2 * LAMPORTS,
      tokenAmount: 20_000_000,
      slot: 3,
      signature: "s3",
    });
    state = applySell(state, {
      wallet: "w",
      mint: "a",
      side: "sell",
      solLamports: 1.5 * LAMPORTS,
      tokenAmount: 10_000_000,
      slot: 4,
      signature: "s4",
    });
    state = applySell(state, {
      wallet: "w",
      mint: "b",
      side: "sell",
      solLamports: 1 * LAMPORTS,
      tokenAmount: 5_000_000,
      slot: 5,
      signature: "s5",
    });
    state = applySell(state, {
      wallet: "w",
      mint: "c",
      side: "sell",
      solLamports: 1 * LAMPORTS,
      tokenAmount: 20_000_000,
      slot: 6,
      signature: "s6",
    });
    expect(calculatePnlPercent(state)).toBe(0);
  });

  it("rejects buy below 0.2 SOL", () => {
    const state = applyBuy(createPnlState(), {
      wallet: "w",
      mint: "a",
      side: "buy",
      solLamports: 0.1 * LAMPORTS,
      tokenAmount: 1_000_000,
      slot: 1,
      signature: "s",
    });
    expect(state.solInLamports).toBe(0);
  });

  it("no buys = 0%", () => {
    expect(calculatePnlPercent(createPnlState())).toBe(0);
  });

  it("comparePnl tie", () => {
    expect(comparePnl(10, 10)).toBe("tie");
  });
});
