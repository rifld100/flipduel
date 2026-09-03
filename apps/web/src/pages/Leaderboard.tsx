import { useEffect, useState } from "react";
import { api, formatPct, shortAddr } from "../api";

interface Entry {
  wallet: string;
  wins: number;
  matches: number;
  winrate: number;
  best_pnl_pct: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api<Entry[]>("/leaderboard").then(setEntries);
  }, []);

  return (
    <div>
      <div className="page-header">
        <p className="hero-eyebrow">Rankings</p>
        <h1>Leaderboard</h1>
        <p className="muted">Wins, winrate, matches, best %.</p>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Wins</th>
            <th>Matches</th>
            <th>Winrate</th>
            <th>Best %</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.wallet}>
              <td>{shortAddr(e.wallet)}</td>
              <td>{e.wins}</td>
              <td>{e.matches}</td>
              <td>{(e.winrate * 100).toFixed(1)}%</td>
              <td>{formatPct(e.best_pnl_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
