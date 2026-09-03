import { Link } from "react-router-dom";

export default function StartDuelCard() {
  return (
    <aside className="start-card">
      <h6 className="start-card-title">Start a Duel</h6>
      <p className="start-card-desc">
        Create a room or join the lobby. Deposit from Phantom — no Connect Wallet.
      </p>
      <Link to="/create" className="btn-outline">Create Room</Link>
      <div className="start-card-meta">
        <div className="avatar" aria-hidden />
        <div>
          <p className="meta-name">Flipduel</p>
          <p className="meta-sub">Liked by 50+ degens</p>
        </div>
      </div>
    </aside>
  );
}
