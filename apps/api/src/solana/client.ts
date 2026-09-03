import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getVaultKey, storeVaultKey } from "../db/queries.js";

function resolveRpcUrl(): string {
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  if (process.env.HELIUS_RPC_URL) return process.env.HELIUS_RPC_URL;
  if (process.env.HELIUS_API_KEY) {
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  }
  return "https://api.devnet.solana.com";
}

const RPC = resolveRpcUrl();

export const connection = new Connection(RPC, "confirmed");

export function getAuthorityKeypair(): Keypair | null {
  const key = process.env.AUTHORITY_PRIVATE_KEY;
  if (!key) return null;
  try {
    const decoded = Uint8Array.from(JSON.parse(key));
    return Keypair.fromSecretKey(decoded);
  } catch {
    try {
      return Keypair.fromSecretKey(bs58.decode(key));
    } catch {
      return null;
    }
  }
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function createVaultForRoom(roomId: string): PublicKey {
  const vault = Keypair.generate();
  storeVaultKey(roomId, Buffer.from(vault.secretKey).toString("base64"));
  return vault.publicKey;
}

export function getVaultKeypair(roomId: string): Keypair | null {
  const stored = getVaultKey(roomId);
  if (!stored) return null;
  return Keypair.fromSecretKey(Buffer.from(stored, "base64"));
}

export async function getBalance(pubkey: string): Promise<number> {
  return connection.getBalance(new PublicKey(pubkey));
}

export async function sendSol(
  from: Keypair,
  to: string,
  lamports: number
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(to),
      lamports,
    })
  );
  return sendAndConfirmTransaction(connection, tx, [from]);
}

export async function payoutWinner(
  roomId: string,
  winnerWallet: string,
  bankLamports: number
): Promise<string | null> {
  const vault = getVaultKeypair(roomId);
  if (!vault) return null;
  const balance = await connection.getBalance(vault.publicKey);
  const amount = Math.min(balance, bankLamports);
  if (amount <= 0) return null;
  return sendSol(vault, winnerWallet, amount);
}

export async function payoutTie(
  roomId: string,
  player1: string,
  player2: string,
  stakeLamports: number
): Promise<string | null> {
  const vault = getVaultKeypair(roomId);
  if (!vault) return null;
  const tx = new Transaction()
    .add(
      SystemProgram.transfer({
        fromPubkey: vault.publicKey,
        toPubkey: new PublicKey(player1),
        lamports: stakeLamports,
      })
    )
    .add(
      SystemProgram.transfer({
        fromPubkey: vault.publicKey,
        toPubkey: new PublicKey(player2),
        lamports: stakeLamports,
      })
    );
  return sendAndConfirmTransaction(connection, tx, [vault]);
}

export async function refundCreator(
  roomId: string,
  player1: string,
  stakeLamports: number
): Promise<string | null> {
  const vault = getVaultKeypair(roomId);
  if (!vault) return null;
  const balance = await connection.getBalance(vault.publicKey);
  const amount = Math.min(balance, stakeLamports);
  if (amount <= 0) return null;
  return sendSol(vault, player1, amount);
}

export async function getRecentTransfersToVault(
  vaultPubkey: string,
  limit = 20
): Promise<
  Array<{ from: string; lamports: number; signature: string; slot: number }>
> {
  const pubkey = new PublicKey(vaultPubkey);
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit });
  const results: Array<{
    from: string;
    lamports: number;
    signature: string;
    slot: number;
  }> = [];

  for (const sig of sigs) {
    const tx = await connection.getTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (!tx?.meta || !tx.transaction) continue;
    const accountKeys = tx.transaction.message.getAccountKeys();
    const pre = tx.meta.preBalances;
    const post = tx.meta.postBalances;
    for (let i = 0; i < accountKeys.length; i++) {
      if (accountKeys.get(i)?.toBase58() === vaultPubkey) {
        const delta = post[i] - pre[i];
        if (delta > 0) {
          const fromIdx = tx.meta.preBalances.findIndex(
            (_, j) => j !== i && post[j] < pre[j]
          );
          const from =
            fromIdx >= 0
              ? accountKeys.get(fromIdx)?.toBase58() ?? "unknown"
              : "unknown";
          results.push({
            from,
            lamports: delta,
            signature: sig.signature,
            slot: sig.slot,
          });
        }
      }
    }
  }
  return results;
}

export async function getCurrentSlot(): Promise<number> {
  return connection.getSlot();
}
