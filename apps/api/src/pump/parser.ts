import {
  PUMP_BONDING_CURVE_PROGRAM_ID,
  PUMP_SWAP_PROGRAM_ID,
} from "@flipduel/shared";
import type { TradeEvent } from "@flipduel/shared";
import { connection } from "../solana/client.js";

const PUMP_PROGRAMS = new Set([
  PUMP_BONDING_CURVE_PROGRAM_ID,
  PUMP_SWAP_PROGRAM_ID,
]);

export async function fetchPumpTradesForWallet(
  wallet: string,
  minSlot: number
): Promise<TradeEvent[]> {
  const pubkey = wallet;
  const sigs = await connection.getSignaturesForAddress(
    new (await import("@solana/web3.js")).PublicKey(pubkey),
    { limit: 50 }
  );

  const trades: TradeEvent[] = [];

  for (const sig of sigs) {
    if (sig.slot < minSlot) continue;
    const parsed = await parseTransaction(sig.signature, wallet);
    if (parsed) trades.push(...parsed);
  }

  return trades.sort((a, b) => a.slot - b.slot);
}

export async function parseTransaction(
  signature: string,
  wallet: string
): Promise<TradeEvent[] | null> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta) return null;

  const trades: TradeEvent[] = [];
  const { PublicKey } = await import("@solana/web3.js");
  const walletPk = new PublicKey(wallet);

  const accountKeys = tx.transaction.message.getAccountKeys();
  const walletIndex = accountKeys.staticAccountKeys.findIndex(
    (k: { equals: (pk: typeof walletPk) => boolean }) => k.equals(walletPk)
  );
  if (walletIndex < 0) return null;

  const preSol = tx.meta.preBalances[walletIndex];
  const postSol = tx.meta.postBalances[walletIndex];
  const solDelta = postSol - preSol;

  const inner = tx.meta.innerInstructions ?? [];
  const instructions = tx.transaction.message.compiledInstructions;

  const hasPumpInner = inner.some((g: { index: number }) => {
    const pid = accountKeys.get(g.index)?.toBase58();
    return pid && PUMP_PROGRAMS.has(pid);
  });

  const pumpInvolved =
    instructions.some((ix: { programIdIndex: number }) => {
      const pid = accountKeys.get(ix.programIdIndex)?.toBase58();
      return pid && PUMP_PROGRAMS.has(pid);
    }) || hasPumpInner;

  if (!pumpInvolved) return null;

  const preToken = tx.meta.preTokenBalances ?? [];
  const postToken = tx.meta.postTokenBalances ?? [];

  let tokenDelta = 0;
  let mint = "unknown";

  for (const post of postToken) {
    if (post.owner !== wallet) continue;
    const pre = preToken.find(
      (p) => p.accountIndex === post.accountIndex
    );
    const preAmt = pre ? Number(pre.uiTokenAmount.amount) : 0;
    const postAmt = Number(post.uiTokenAmount.amount);
    tokenDelta = postAmt - preAmt;
    mint = post.mint;
  }

  if (tokenDelta === 0 && solDelta === 0) return null;

  const side: "buy" | "sell" =
    tokenDelta > 0 || solDelta < 0 ? "buy" : "sell";
  const solLamports = Math.abs(solDelta);

  trades.push({
    wallet,
    mint,
    side,
    solLamports,
    tokenAmount: Math.abs(tokenDelta),
    slot: tx.slot,
    signature,
  });

  return trades;
}

export async function getMintPriceSol(mint: string): Promise<number> {
  const rpc = process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : process.env.SOLANA_RPC_URL;

  if (!rpc) return 0;

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`
    );
    const data = await res.json();
    const pair = data.pairs?.find(
      (p: { chainId: string }) => p.chainId === "solana"
    );
    if (pair?.priceNative) return Number(pair.priceNative);
  } catch {
    /* fallback */
  }
  return 0;
}
