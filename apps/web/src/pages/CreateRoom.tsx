import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useWallet } from "../hooks";

export default function CreateRoom() {
  const { wallet, isSet } = useWallet();
  const nav = useNavigate();
  const [bankSol, setBankSol] = useState("0.1");
  const [durationMin, setDurationMin] = useState<5 | 15 | 30>(15);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isSet) {
      setError("Set wallet on Home first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const room = await api<{ id: string }>("/rooms", {
        method: "POST",
        body: JSON.stringify({
          wallet,
          bankSol: Number(bankSol),
          durationMin,
        }),
      });
      nav(`/room/${room.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <p className="hero-eyebrow">New duel</p>
        <h1>Create room</h1>
        <p className="muted">Set bank and duration. Deposit half from Phantom.</p>
      </div>

      <div className="card">
        <div className="form-row">
          <label>Bank (SOL) — min 0.05</label>
          <input
            type="number"
            min={0.05}
            step={0.01}
            value={bankSol}
            onChange={(e) => setBankSol(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Duration</label>
          <select
            value={durationMin}
            onChange={(e) =>
              setDurationMin(Number(e.target.value) as 5 | 15 | 30)
            }
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
        {error && <p style={{ color: "var(--negative)" }}>{error}</p>}
        <button onClick={submit} disabled={loading}>
          {loading ? "Creating…" : "Create room"}
        </button>
      </div>
    </div>
  );
}
