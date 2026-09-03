import { Link } from "react-router-dom";
import HeroRotor from "../components/HeroRotor";
import { SectionLabel } from "../components/SectionLabel";
import StartDuelCard from "../components/StartDuelCard";
import { useWallet } from "../hooks";

const STACK = [
  "Solana",
  "Pump.fun",
  "PumpSwap",
  "Phantom",
  "PnL%",
  "Escrow",
  "1v1",
  "Memecoins",
  "Devnet",
  "Leaderboard",
];

const SERVICES = [
  {
    title: "Create Room",
    desc: "Set bank (min 0.05 SOL), pick 5/15/30 min. Deposit half from Phantom.",
  },
  {
    title: "PvL Duel",
    desc: "Trade only on Pump. Portfolio PnL% in SOL decides the winner.",
  },
  {
    title: "Escrow Bank",
    desc: "Winner takes full bank. Tie returns both stakes. 0% platform fee.",
  },
  {
    title: "Live Score",
    desc: "Real-time % chart and trade feed during the round.",
  },
  {
    title: "Leaderboard",
    desc: "Wins, winrate, matches, and best % per wallet.",
  },
  {
    title: "No Connect",
    desc: "Paste wallet, cache locally. Manual SOL transfer to vault.",
  },
];

const STEPS = [
  {
    num: "[001]",
    title: "Paste wallet",
    desc: "No Wallet Adapter. Your address is cached in the browser for duels and escrow.",
    time: "Instant",
  },
  {
    num: "[002]",
    title: "Create or join",
    desc: "Set bank size and duration, or browse the lobby with filters.",
    time: "1 min",
  },
  {
    num: "[003]",
    title: "Deposit escrow",
    desc: "Send exactly half the bank from your wallet to the room vault in Phantom.",
    time: "2 min",
  },
  {
    num: "[004]",
    title: "Prep 30s",
    desc: "Both deposits confirmed. No trades count until the main timer starts.",
    time: "30 sec",
  },
  {
    num: "[005]",
    title: "Trade Pump",
    desc: "Buy/sell memecoins on bonding curve or PumpSwap. Min buy 0.2 SOL per tx.",
    time: "5–30 min",
  },
  {
    num: "[006]",
    title: "Settlement",
    desc: "Higher portfolio PnL% wins the bank. Tie refunds both. Stats update.",
    time: "Auto",
  },
];

const FAQ = [
  {
    q: "How is PnL calculated?",
    a: "Portfolio %: total SOL out (sells + mark-to-market) divided by total qualifying buys (≥0.2 SOL each). Not average of per-token percentages.",
  },
  {
    q: "What trades count?",
    a: "Only Pump.fun and PumpSwap for the same mint, after the round timer starts. No Jupiter-only routes.",
  },
  {
    q: "Minimum bank?",
    a: "0.05 SOL total bank. Each player deposits exactly half. Winner takes the full bank.",
  },
  {
    q: "Do I need Connect Wallet?",
    a: "No. Paste your address and send SOL manually from Phantom to the escrow address shown.",
  },
  {
    q: "What if nobody joins?",
    a: "Creator can end search and get their deposit back before the opponent joins.",
  },
  {
    q: "Tie rules?",
    a: "Equal PnL% is a full tie. Both players get their stakes back. Match counts on leaderboard.",
  },
];

export default function Home() {
  const { wallet, save, isSet } = useWallet();

  return (
    <div className="home">
      <section className="hero hero-mondragon">
        <HeroRotor />
        <div className="hero-bottom">
          <p className="hero-eyebrow">Solana PvL duel arena</p>
          <h1 className="hero-mega">FLIPDUEL</h1>
        </div>
        <div className="hero-float-card">
          <StartDuelCard />
        </div>
        <p className="hero-sub hero-sub--scroll">
          From deposit to settlement — 1v1 Pump.fun duels where portfolio
          PnL% wins the bank with growth-driven clarity.
        </p>
      </section>

      <section className="section" id="about">
        <SectionLabel number="[01]" title="More about" />
        <h2>Trade memecoins. Win the bank.</h2>
        <p className="lead">
          Flipduel is a Solana-native 1v1 arena. Two traders face off for a fixed
          time window, trading only on Pump. The higher portfolio PnL% takes
          the escrow bank. Simplicity, on-chain deposits, measurable outcomes.
        </p>
        <h6 style={{ marginTop: "2rem", fontSize: "0.65rem", letterSpacing: "0.15em" }}>
          OUR STACK
        </h6>
        <div className="stack-marquee">
          {STACK.map((tag) => (
            <span key={tag} className="stack-tag">{tag}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionLabel number="[02]" title="Features" />
        <h2>Services</h2>
        <div className="services-grid">
          {SERVICES.map((s) => (
            <div key={s.title} className="service-card">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionLabel number="[03]" title="Live metrics" />
        <h2>Why traders duel here</h2>
        <p className="lead">
          Real SOL, real Pump trades, transparent rules. No paper points — only
          portfolio % and the bank.
        </p>
        <div className="stats-row">
          <div>
            <p className="stat-value">0%</p>
            <p className="stat-label">Platform fee on bank</p>
          </div>
          <div>
            <p className="stat-value">0.2</p>
            <p className="stat-label">Min buy SOL per tx</p>
          </div>
          <div>
            <p className="stat-value">1v1</p>
            <p className="stat-label">Head to head only</p>
          </div>
        </div>
        <Link to="/lobby" className="btn-outline">View open rooms</Link>
      </section>

      <section className="section">
        <SectionLabel number="[04]" title="How we work" />
        <h2>How a duel runs</h2>
        <div className="process-list">
          {STEPS.map((step) => (
            <div key={step.num} className="process-item">
              <span className="process-time">{step.num}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              <span className="process-time">{step.time}</span>
            </div>
          ))}
        </div>
        <Link to="/create" className="btn-primary" style={{ marginTop: "2rem", display: "inline-block" }}>
          Start a duel
        </Link>
      </section>

      <section className="section">
        <SectionLabel number="[05]" title="Testimonials" />
        <div className="testimonials">
          <div className="testimonial">
            <p>
              Finally a duel site that counts portfolio %, not who bought the
              most tokens. Escrow is clear and Phantom deposit is simple.
            </p>
            <p className="testimonial-author">Maya Patel</p>
            <p className="testimonial-role">Memecoin trader</p>
          </div>
          <div className="testimonial">
            <p>
              No Connect Wallet — I paste my address, send half the bank, and
              trade on Pump like normal. Leaderboard is the flex.
            </p>
            <p className="testimonial-author">Alex Chen</p>
            <p className="testimonial-role">Degen, Solana</p>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel number="[08]" title="FAQ" />
        <h2>FAQ</h2>
        <div className="faq-list">
          {FAQ.map((item) => (
            <div key={item.q} className="faq-item">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Start a duel</h2>
        <p className="lead">Paste your wallet and enter the lobby or create a room.</p>
        <div className="wallet-bar" style={{ marginTop: "1.5rem" }}>
          <input
            value={wallet}
            onChange={(e) => save(e.target.value)}
            placeholder="Your Solana wallet address"
          />
          {isSet && (
            <Link to="/create" className="btn-primary">Create room</Link>
          )}
        </div>
      </section>

      <footer className="home-footer">
        <p className="hero-eyebrow">Solana PvL duel arena · $FLIP</p>
        <p className="home-footer-mega">FLIPDUEL</p>
        <p className="muted" style={{ marginTop: "1rem" }}>
          © Flipduel. Pump.fun 1v1. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
