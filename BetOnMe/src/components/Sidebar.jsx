import { useEffect } from "react";
import { useAuth } from "../lib/authContextCore";
import "./Sidebar.css";

function truncateAddr(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Sidebar({ open, onClose, goals = [] }) {
  const { user } = useAuth();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resolved = goals.filter((g) => g.status === "succeeded" || g.status === "failed");

  return (
    <>
      <div className={`sidebar-scrim ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="sidebar-header">
          <div className="sidebar-avatar">
            {user?.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="sidebar-name">{user?.displayName || "Not signed in"}</div>
            <div className="sidebar-username muted">
              {user ? `@${user.username}` : ""}
            </div>
          </div>
          <button className="btn btn-ghost sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Wallet</div>
          <div className="wallet-card">
            <div className="wallet-label muted">XRPL address (shared demo wallet)</div>
            <div className="wallet-addr" title={user?.walletAddress || ""}>
              {truncateAddr(user?.walletAddress)}
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Bet history</div>
          {resolved.length === 0 ? (
            <div className="muted">No resolved bets yet.</div>
          ) : (
            <ul className="history">
              {resolved.slice(0, 8).map((g) => (
                <li key={g.id} className="history-row">
                  <span className="history-title">{g.title}</span>
                  <span className={`badge ${g.status === "succeeded" ? "badge-success" : "badge-failed"}`}>
                    {g.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
