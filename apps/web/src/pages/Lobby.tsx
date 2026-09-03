import { Link } from "react-router-dom";
import { useState } from "react";
import { shortAddr, type Room } from "../api";
import { useRooms } from "../hooks";

export default function Lobby() {
  const [status, setStatus] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [bankMin, setBankMin] = useState("");
  const [bankMax, setBankMax] = useState("");

  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  if (durationMin) filters.durationMin = durationMin;
  if (bankMin) filters.bankMin = bankMin;
  if (bankMax) filters.bankMax = bankMax;

  const { rooms, loading } = useRooms(filters);

  return (
    <div>
      <div className="page-header">
        <p className="hero-eyebrow">Open rooms</p>
        <h1>Lobby</h1>
        <p className="muted">Filter duels and join with a Phantom deposit.</p>
      </div>

      <div className="card grid-2">
        <div className="form-row">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="open">Open</option>
            <option value="awaiting_creator_deposit">Awaiting deposit</option>
            <option value="live">Live</option>
            <option value="prep">Prep</option>
          </select>
        </div>
        <div className="form-row">
          <label>Duration (min)</label>
          <select
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          >
            <option value="">Any</option>
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="30">30</option>
          </select>
        </div>
        <div className="form-row">
          <label>Bank min SOL</label>
          <input value={bankMin} onChange={(e) => setBankMin(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Bank max SOL</label>
          <input value={bankMax} onChange={(e) => setBankMax(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Bank</th>
              <th>Time</th>
              <th>Status</th>
              <th>Player 1</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r: Room) => (
              <tr key={r.id}>
                <td>{r.bankSol} SOL</td>
                <td>{r.durationMin}m</td>
                <td><span className="badge">{r.status}</span></td>
                <td>{shortAddr(r.player1)}</td>
                <td>
                  <Link to={`/room/${r.id}`} className="btn-outline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
