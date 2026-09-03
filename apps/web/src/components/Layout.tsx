import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/#about", label: "Rules" },
  { to: "/lobby", label: "Lobby" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/create", label: "Create" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="site">
      <header className="nav-bar">
        <Link to="/" className="nav-logo">F</Link>
        <nav className="nav-links" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                location.pathname === item.to.split("#")[0]
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="nav-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <main className={isHome ? "main-wide" : "main"}>{children}</main>

      {!isHome && (
        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <p className="footer-brand">Flipduel</p>
              <p className="muted">Solana PvL duel arena · $FLIP</p>
            </div>
            <div className="footer-links">
              <Link to="/lobby">Lobby</Link>
              <Link to="/create">Create room</Link>
              <Link to="/leaderboard">Leaderboard</Link>
            </div>
          </div>
          <p className="footer-copy">© Flipduel. Pump.fun 1v1 PnL duels.</p>
        </footer>
      )}
    </div>
  );
}
