import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  api,
  formatPct,
  shortAddr,
  type DuelState,
  type Room,
} from "../api";
import { useCountdown, useWallet } from "../hooks";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { wallet, isSet } = useWallet();
  const [room, setRoom] = useState<Room | null>(null);
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [trades, setTrades] = useState<
    Array<{
      wallet: string;
      mint: string;
      side: string;
      sol_lamports: number;
      signature: string;
    }>
  >([]);
  const [error, setError] = useState("");

  const prepRemaining = useCountdown(room?.prepEndsAt ?? null);
  const roundRemaining = useCountdown(room?.roundEndsAt ?? null);

  const load = async () => {
    if (!id) return;
    const r = await api<Room>(`/rooms/${id}`);
    setRoom(r);
    const d = await api<DuelState>(`/duels/${id}`);
    setDuel(d);
    const t = await api<
      Array<{
        wallet: string;
        mint: string;
        side: string;
        sol_lamports: number;
        signature: string;
      }>
    >(`/duels/${id}/trades`);
    setTrades(t);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const join = async () => {
    if (!id || !isSet) return;
    setError("");
    try {
      await api(`/rooms/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ wallet }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const cancel = async () => {
    if (!id || !isSet) return;
    try {
      await api(`/rooms/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ wallet }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!room) return <p className="muted">Loading room…</p>;

  const isCreator = wallet === room.player1;

  return (
    <div>
      <div className="page-header">
        <p className="hero-eyebrow">Live duel</p>
        <h1>Room {shortAddr(room.id)}</h1>
        <p className="muted">
          Status <span className="badge">{room.status}</span> · Bank {room.bankSol} SOL · {room.durationMin} min
        </p>
      </div>

      <div className="card">
        <h3>Escrow deposit</h3>
        <p className="muted">
          Send <strong>exactly {room.depositSol} SOL</strong> from your cached wallet in Phantom:
        </p>
        <div className="vault-box">{room.vaultAddress}</div>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          P1 {room.player1Deposited ? "✓" : "…"} · P2 {room.player2Deposited ? "✓" : "…"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {!room.player2 && isSet && wallet !== room.player1 && (
          <button onClick={join}>Join room</button>
        )}
        {isCreator && !room.player2Deposited && (
          <button className="secondary" onClick={cancel}>End search</button>
        )}
      </div>

      {error && <p style={{ color: "var(--negative)", marginTop: "1rem" }}>{error}</p>}

      {room.status === "prep" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Preparation</h3>
          <div className="timer">{prepRemaining}s</div>
          <p className="muted">PnL starts after prep.</p>
        </div>
      )}

      {(room.status === "live" || room.status === "settling") && duel && (
        <div className="card grid-2" style={{ marginTop: "1rem" }}>
          <div>
            <h3>{shortAddr(duel.player1)}</h3>
            <div className={duel.player1PnlPct >= 0 ? "pnl-positive" : "pnl-negative"} style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 800 }}>
              {formatPct(duel.player1PnlPct)}
            </div>
          </div>
          <div>
            <h3>{shortAddr(duel.player2)}</h3>
            <div className={duel.player2PnlPct >= 0 ? "pnl-positive" : "pnl-negative"} style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 800 }}>
              {formatPct(duel.player2PnlPct)}
            </div>
          </div>
          <div className="timer">{roundRemaining}s</div>
        </div>
      )}

      {room.status === "settled" && duel && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Result</h3>
          {duel.result === "tie" ? (
            <p>Tie — deposits returned</p>
          ) : (
            <p>
              Winner {duel.winner ? shortAddr(duel.winner) : "—"}
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Trades</h3>
        {trades.length === 0 ? (
          <p className="muted">No qualifying Pump trades yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Side</th>
                <th>SOL</th>
                <th>Mint</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.signature}>
                  <td>{shortAddr(t.wallet)}</td>
                  <td>{t.side}</td>
                  <td>{(t.sol_lamports / 1e9).toFixed(4)}</td>
                  <td>{shortAddr(t.mint)}</td>
                  <td>
                    <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
