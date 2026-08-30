import React, { useState } from 'react';

// Mock Blood Banks & Donors Database
const MOCK_DATA = {
  bloodBanks: [
    { id: 1, name: "City Care Blood Bank", distance: "2.4 km", O_neg: 5, A_pos: 12, B_pos: 8, status: "Available" },
    { id: 2, name: "LifeLine Red Cross Center", distance: "4.1 km", O_neg: 0, A_pos: 6, B_pos: 15, status: "Low Stock" },
    { id: 3, name: "Apex Emergency Hospital", distance: "5.8 km", O_neg: 3, A_pos: 20, B_pos: 4, status: "Available" }
  ],
  donors: [
    { id: 101, name: "Rahul Sharma", bloodGroup: "O-", distance: "1.2 km", phone: "+91 98765 43210", lastDonated: "4 months ago" },
    { id: 102, name: "Priya Singh", bloodGroup: "A+", distance: "2.8 km", phone: "+91 98123 45678", lastDonated: "6 months ago" },
    { id: 103, name: "Amit Verma", bloodGroup: "O-", distance: "3.5 km", phone: "+91 99887 76655", lastDonated: "3 months ago" }
  ]
};

export default function App() {
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState('Critical');
  const [location, setLocation] = useState('Central District Hospital');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate AI Orchestration matching delay
    setTimeout(() => {
      const filteredBanks = MOCK_DATA.bloodBanks.map(bank => ({
        ...bank,
        availableUnits: bloodGroup === 'O-' ? bank.O_neg : bank.A_pos
      }));
      const filteredDonors = MOCK_DATA.donors.filter(d => d.bloodGroup === bloodGroup || bloodGroup === 'O-');
      
      setSearchResults({
        banks: filteredBanks,
        donors: filteredDonors
      });
      setIsSearching(false);
    }, 800);
  };

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
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
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

            <button type="submit" style={styles.submitBtn}>
              {isSearching ? 'Orchestrating Network Match...' : 'Broadcast SOS Request'}
            </button>
          </form>
        </div>

        {/* Right Column: AI Matching Output & Live Stock */}
        <div style={styles.resultsContainer}>
          {!searchResults ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '50px 20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Network Ready</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Fill out the SOS form to trigger the real-time AI matching engine across nearby blood banks and registered emergency donors.
              </p>
            </div>
          ) : (
            <>
              {/* Matched Blood Banks */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🏥 Matched Blood Banks ({searchResults.banks.length})</h3>
                <div style={styles.list}>
                  {searchResults.banks.map(bank => (
                    <div key={bank.id} style={styles.listItem}>
                      <div>
                        <strong>{bank.name}</strong>
                        <div style={styles.metaText}>Distance: {bank.distance}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={bank.availableUnits > 0 ? styles.stockBadge : styles.emptyBadge}>
                          {bank.availableUnits} Units Available ({bloodGroup})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Volunteer Donors */}
              <div style={{ ...styles.card, marginTop: '20px' }}>
                <h3 style={styles.cardTitle}>🙋‍♂️ Nearby Volunteer Donors ({searchResults.donors.length})</h3>
                <div style={styles.list}>
                  {searchResults.donors.map(donor => (
                    <div key={donor.id} style={styles.listItem}>
                      <div>
                        <strong>{donor.name} ({donor.bloodGroup})</strong>
                        <div style={styles.metaText}>{donor.distance} away • Last donated {donor.lastDonated}</div>
                      </div>
                      <button 
                        onClick={() => alert(`Dispatching SOS notification to ${donor.name}`)}
                        style={styles.notifyBtn}
                      >
                        Send Alert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
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
    gap: '24px'
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
  }
};
