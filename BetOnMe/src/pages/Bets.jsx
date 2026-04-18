import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import AddBetModal from "../components/AddBetModal";
import "./Bets.css";

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function timeLeftLabel(targetIso, windowMinutes, now) {
  if (!targetIso) return "—";
  const end =
    new Date(targetIso).getTime() + (windowMinutes ?? 30) * 60 * 1000;
  const ms = end - now;
  if (ms <= 0) return "past due";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function statusBadgeClass(status) {
  switch (status) {
    case "active":
      return "badge badge-active";
    case "succeeded":
      return "badge badge-success";
    case "failed":
      return "badge badge-failed";
    case "expired":
      return "badge badge-expired";
    default:
      return "badge";
  }
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function Bets() {
  const { goals, goalsLoading, goalsError, refreshGoals } = useOutletContext();
  const [modalOpen, setModalOpen] = useState(false);
  const now = useNow();

  return (
    <div className="page bets">
      <header className="bets-header">
        <div>
          <div className="section-title">BetOnMe</div>
          <h1>Your bets</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add bet
        </button>
      </header>

      {goalsError && <div className="error-banner">{goalsError}</div>}

      <div className="box table-wrap">
        <table className="bets-table">
          <thead>
            <tr>
              <th>Goal</th>
              <th>Time left</th>
              <th>Wager</th>
              <th>Date placed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {goalsLoading && goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading…
                </td>
              </tr>
            ) : goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>
                  No bets yet. Place your first one to get started.
                </td>
              </tr>
            ) : (
              goals.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="goal-cell">
                      <span className="goal-title">{g.title}</span>
                      {g.location?.name && (
                        <span className="muted small">@ {g.location.name}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {g.status === "active"
                      ? timeLeftLabel(g.target?.targetAt, g.target?.windowMinutes, now)
                      : g.status}
                  </td>
                  <td>{g.stakeAmount} XRP</td>
                  <td>{fmtDate(g.createdAt)}</td>
                  <td>
                    <span className={statusBadgeClass(g.status)}>{g.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <button
          className="fab"
          onClick={() => setModalOpen(true)}
          title="Add bet"
        >
          +
        </button>
      </div>

      <AddBetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refreshGoals}
      />
    </div>
  );
}

export default Bets;
