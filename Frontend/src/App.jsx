import React, { useState } from 'react';
import {
  createRequest,
  getDonors,
  reserve,
  acceptRequest,
  rejectRequest,
} from './api';
import OrchestrationMap from './OrchestrationMap';

// Frontend urgency labels -> backend urgency keys understood by the matching engine.
const URGENCY_MAP = {
  Critical: 'critical',
  High: 'urgent',
  Moderate: 'routine',
};

// Requesting hospital location for the map (demo default, near the seeded banks/donors).
// The name shown on the pin comes from the "Hospital / Patient Location" field.
const HOSPITAL_COORDS = { lat: 28.6139, lng: 77.2090 };

export default function App() {
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState('Critical');
  const [location, setLocation] = useState('Central District Hospital');

  const [isSearching, setIsSearching] = useState(false);
  const [request, setRequest] = useState(null); // { id, bloodGroup, units, urgency, matches, currentMatchIndex, status }
  const [donors, setDonors] = useState([]);
  const [reservedBankId, setReservedBankId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const activeMatch =
    request && request.matches && request.matches.length > request.currentMatchIndex
      ? request.matches[request.currentMatchIndex]
      : null;

  const isAccepted = request && request.status === 'accepted';
  const isNoMatch = request && request.status === 'no-match';

  // Broadcast the SOS: create the request on the backend + load the donor network.
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setActionMsg(null);
    setRequest(null);
    setReservedBankId(null);
    setDonors([]);

    try {
      const res = await createRequest({
        bloodGroup,
        units: Number(units),
        urgency: URGENCY_MAP[urgency] || 'routine',
      });
      setRequest(res.request);

      const donorList = await getDonors(bloodGroup);
      setDonors(donorList || []);
    } catch (err) {
      setError(err.message || 'Failed to reach the orchestration backend.');
    } finally {
      setIsSearching(false);
    }
  };

  // Reserve blood at the current best (active) source.
  const handleReserve = async () => {
    if (!activeMatch) return;
    setBusy(true);
    setError(null);
    try {
      const r = await reserve({
        bankId: activeMatch.bankId,
        bloodGroup: request.bloodGroup,
        units: request.units,
      });
      setReservedBankId(activeMatch.bankId);
      setActionMsg(
        `Reserved ${r.reservedUnits} unit(s) of ${r.bloodGroup} at ${r.bankName} — ${r.remainingUnits} left in stock.`
      );
    } catch (err) {
      setError(err.message || 'Reservation failed.');
    } finally {
      setBusy(false);
    }
  };

  // Bank accepts -> request fulfilled.
  const handleAccept = async () => {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      await acceptRequest(request.id);
      const acceptedBank = activeMatch ? activeMatch.bankName : 'the blood bank';
      setRequest((prev) => ({ ...prev, status: 'accepted' }));
      setActionMsg(`${acceptedBank} accepted the request. Blood is on the way.`);
    } catch (err) {
      setError(err.message || 'Accept failed.');
    } finally {
      setBusy(false);
    }
  };

  // Bank rejects -> escalate to the next feasible source (or exhaust the list).
  const handleReject = async () => {
    if (!request) return;
    setBusy(true);
    setError(null);
    setReservedBankId(null);
    try {
      const r = await rejectRequest(request.id);
      if (r.status === 'no-match') {
        setRequest((prev) => ({
          ...prev,
          status: 'no-match',
          currentMatchIndex: prev.currentMatchIndex + 1,
        }));
        setActionMsg('All feasible banks exhausted — escalate to the volunteer donor network below.');
      } else {
        setRequest((prev) => ({
          ...prev,
          status: 'escalated',
          currentMatchIndex: prev.currentMatchIndex + 1,
        }));
        setActionMsg(`Escalated to the next source: ${r.nextMatch.bankName}.`);
      }
    } catch (err) {
      setError(err.message || 'Reject failed.');
    } finally {
      setBusy(false);
    }
  };

  const status = deriveStatus(request, reservedBankId);

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.logoBadge}>🩸</div>
          <div>
            <h1 style={styles.title}>RaktaSetu</h1>
            <p style={styles.subtitle}>Real-Time Emergency Blood Orchestration Network</p>
          </div>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.pulseDot}></span> Live AI Network Active
        </div>
      </header>

      {/* Main Grid */}
      <div style={styles.grid}>

        {/* Left Column: Emergency SOS Form */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🚨 Create Emergency Request (SOS)</h2>
          <form onSubmit={handleSearch} style={styles.form}>

            <div style={styles.formGroup}>
              <label style={styles.label}>Required Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                style={styles.select}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Units Required</label>
              <input
                type="number"
                value={units}
                min="1"
                max="10"
                onChange={(e) => setUnits(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                style={styles.select}
              >
                <option value="Critical">Critical (&lt; 1 Hour)</option>
                <option value="High">High (&lt; 3 Hours)</option>
                <option value="Moderate">Moderate (Standard)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Hospital / Patient Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.submitBtn} disabled={isSearching}>
              {isSearching ? 'Orchestrating Network Match...' : 'Broadcast SOS Request'}
            </button>
          </form>
        </div>

        {/* Right Column: Live orchestration output */}
        <div style={styles.resultsContainer}>
          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {!request && !isSearching && !error ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '50px 20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Network Ready</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Fill out the SOS form to trigger the real-time matching engine across nearby blood banks and registered emergency donors.
              </p>
            </div>
          ) : null}

          {request && (
            <>
              {/* Request Status */}
              <div style={styles.card}>
                <div style={styles.statusRow}>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>📡 Request Status</h3>
                  {status && (
                    <span style={{ ...styles.badge, ...status.style }}>{status.text}</span>
                  )}
                </div>
                <p style={styles.metaText}>
                  Request #{request.id} • {request.units} unit(s) of{' '}
                  <strong style={{ color: '#f8fafc' }}>{request.bloodGroup}</strong> •{' '}
                  {urgency} urgency • {location}
                </p>
                {actionMsg && <div style={styles.infoBox}>{actionMsg}</div>}
              </div>

              {/* Live Orchestration Map */}
              <div style={{ ...styles.card, marginTop: '20px' }}>
                <h3 style={styles.cardTitle}>🗺️ Live Orchestration Map</h3>
                <OrchestrationMap
                  hospital={{ ...HOSPITAL_COORDS, name: location }}
                  matches={request.matches}
                  donors={donors}
                  currentMatchIndex={request.currentMatchIndex}
                />
                <p style={{ ...styles.metaText, marginTop: '10px' }}>
                  🏥 hospital · 🩸 blood banks (green = current source) · 🙋 volunteer donors
                </p>
              </div>

              {/* Active Source + lifecycle actions */}
              {activeMatch && !isNoMatch && (
                <div style={{ ...styles.card, ...styles.activeCard, marginTop: '20px' }}>
                  <h3 style={styles.cardTitle}>🎯 Fastest Feasible Source</h3>
                  <div style={styles.listItem}>
                    <div>
                      <strong>{activeMatch.bankName}</strong>
                      <div style={styles.metaText}>
                        {activeMatch.distance} km away • Match score {activeMatch.score}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={activeMatch.availableUnits > 0 ? styles.stockBadge : styles.emptyBadge}>
                        {activeMatch.availableUnits} units ({activeMatch.bloodGroup})
                      </span>
                    </div>
                  </div>

                  {isAccepted ? (
                    <div style={{ ...styles.infoBox, marginTop: '14px', color: '#4ade80' }}>
                      ✅ Fulfilled by {activeMatch.bankName}.
                    </div>
                  ) : (
                    <div style={styles.actionRow}>
                      <button
                        onClick={handleReserve}
                        disabled={busy || reservedBankId === activeMatch.bankId}
                        style={{ ...styles.actionBtn, ...styles.btnReserve }}
                      >
                        {reservedBankId === activeMatch.bankId ? 'Reserved ✓' : 'Reserve Blood'}
                      </button>
                      <button
                        onClick={handleAccept}
                        disabled={busy}
                        style={{ ...styles.actionBtn, ...styles.btnAccept }}
                      >
                        Bank Accepts
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={busy}
                        style={{ ...styles.actionBtn, ...styles.btnReject }}
                      >
                        Bank Rejects → Escalate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ranked matches (escalation ladder) */}
              <div style={{ ...styles.card, marginTop: '20px' }}>
                <h3 style={styles.cardTitle}>
                  🏥 Ranked Blood Banks ({request.matches.length})
                </h3>
                {request.matches.length === 0 ? (
                  <div style={styles.infoBox}>
                    No blood bank has {request.units}+ units of {request.bloodGroup}. Routing to the volunteer donor network below.
                  </div>
                ) : (
                  <div style={styles.list}>
                    {request.matches.map((bank, i) => {
                      const isActive = i === request.currentMatchIndex && !isNoMatch;
                      const isPast = i < request.currentMatchIndex;
                      return (
                        <div
                          key={bank.bankId}
                          style={{
                            ...styles.listItem,
                            ...(isActive ? styles.listItemActive : {}),
                            ...(isPast ? styles.listItemPast : {}),
                          }}
                        >
                          <div>
                            <strong>
                              #{i + 1} {bank.bankName}
                              {isActive ? '  ◀ current' : isPast ? '  (rejected)' : ''}
                            </strong>
                            <div style={styles.metaText}>
                              {bank.distance} km • score {bank.score}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={bank.availableUnits > 0 ? styles.stockBadge : styles.emptyBadge}>
                              {bank.availableUnits} units
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Volunteer Donors */}
              <div style={{ ...styles.card, marginTop: '20px' }}>
                <h3 style={styles.cardTitle}>🙋 Nearby Volunteer Donors ({donors.length})</h3>
                {donors.length === 0 ? (
                  <p style={styles.metaText}>No matching volunteer donors found nearby.</p>
                ) : (
                  <div style={styles.list}>
                    {donors.map((donor) => (
                      <div key={donor.id} style={styles.listItem}>
                        <div>
                          <strong>{donor.name} ({donor.bloodGroup})</strong>
                          <div style={styles.metaText}>
                            {donor.distance} km away • Last donated {donor.lastDonated}
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Dispatching SOS alert to ${donor.name} at ${donor.phone}`)}
                          style={styles.notifyBtn}
                        >
                          Send Alert
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// Derive a human-facing status badge from the request + local reservation state.
function deriveStatus(request, reservedBankId) {
  if (!request) return null;
  if (request.status === 'accepted') return { text: 'Accepted', style: { background: '#166534', color: '#4ade80' } };
  if (request.status === 'no-match') return { text: 'No Match', style: { background: '#991b1b', color: '#fca5a5' } };
  if (request.status === 'escalated') return { text: 'Escalated', style: { background: '#92400e', color: '#fcd34d' } };
  if (reservedBankId) return { text: 'Reserved', style: { background: '#1e3a8a', color: '#93c5fd' } };
  if (request.matches && request.matches.length > 0) return { text: 'Matched', style: { background: '#1e3a8a', color: '#93c5fd' } };
  return { text: 'No compatible bank', style: { background: '#991b1b', color: '#fca5a5' } };
}

// Inline Styles to avoid CSS setup issues
const styles = {
  container: {
    fontFamily: 'Segoe UI, Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    minHeight: '100vh',
    padding: '24px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px'
  },
  logoBadge: {
    fontSize: '32px',
    background: '#dc2626',
    borderRadius: '12px',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff'
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8'
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1e293b',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#38bdf8',
    border: '1px solid #334155'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
    alignItems: 'start'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #334155'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: '500'
  },
  select: {
    backgroundColor: '#0f172a',
    color: '#fff',
    border: '1px solid #475569',
    padding: '10px',
    borderRadius: '6px',
    outline: 'none'
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    border: '1px solid #475569',
    padding: '10px',
    borderRadius: '6px',
    outline: 'none'
  },
  submitBtn: {
    marginTop: '10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  listItem: {
    backgroundColor: '#0f172a',
    padding: '14px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #334155'
  },
  listItemActive: {
    border: '1px solid #dc2626',
    boxShadow: '0 0 0 1px #dc2626'
  },
  listItemPast: {
    opacity: 0.5
  },
  metaText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  stockBadge: {
    backgroundColor: '#166534',
    color: '#4ade80',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  emptyBadge: {
    backgroundColor: '#991b1b',
    color: '#fca5a5',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  notifyBtn: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.3px'
  },
  activeCard: {
    border: '1px solid #dc2626'
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
    flexWrap: 'wrap'
  },
  actionBtn: {
    flex: '1 1 auto',
    border: 'none',
    padding: '10px 12px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#fff'
  },
  btnReserve: {
    backgroundColor: '#2563eb'
  },
  btnAccept: {
    backgroundColor: '#16a34a'
  },
  btnReject: {
    backgroundColor: '#b45309'
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    border: '1px solid #b91c1c',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px'
  },
  infoBox: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    border: '1px solid #334155',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginTop: '10px'
  },
  resultsContainer: {}
};
