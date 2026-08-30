import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Emoji pin as a Leaflet divIcon.
// Using divIcon (not the default marker image) avoids Leaflet's well-known
// broken-marker-icon bug under Vite/webpack bundling — no image assets needed.
function makePin(emoji, ringColor) {
  return L.divIcon({
    className: 'raktasetu-pin',
    html:
      `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;` +
      `font-size:16px;background:#0f172a;border:2px solid ${ringColor};border-radius:50%;` +
      `box-shadow:0 2px 6px rgba(0,0,0,0.5)">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

const HOSPITAL_PIN = makePin('🏥', '#38bdf8');
const BANK_PIN = makePin('🩸', '#f87171');
const ACTIVE_BANK_PIN = makePin('🩸', '#22c55e');
const DONOR_PIN = makePin('🙋', '#c084fc');

// Auto-fit the viewport to every marker whenever the set of points changes.
function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
    // Re-fit only when the actual coordinates change (keyed by `key`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function OrchestrationMap({
  hospital,
  matches = [],
  donors = [],
  currentMatchIndex = 0,
}) {
  const bankPoints = useMemo(
    () => matches.filter((m) => typeof m.lat === 'number' && typeof m.lng === 'number'),
    [matches]
  );
  const donorPoints = useMemo(
    () => donors.filter((d) => typeof d.lat === 'number' && typeof d.lng === 'number'),
    [donors]
  );

  const activeMatch = matches.length > currentMatchIndex ? matches[currentMatchIndex] : null;

  const allPoints = [
    [hospital.lat, hospital.lng],
    ...bankPoints.map((m) => [m.lat, m.lng]),
    ...donorPoints.map((d) => [d.lat, d.lng]),
  ];

  return (
    <MapContainer
      center={[hospital.lat, hospital.lng]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: '320px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allPoints} />

      {/* Route line from the hospital to the current chosen source */}
      {activeMatch && typeof activeMatch.lat === 'number' && (
        <Polyline
          positions={[
            [hospital.lat, hospital.lng],
            [activeMatch.lat, activeMatch.lng],
          ]}
          pathOptions={{ color: '#22c55e', weight: 3, dashArray: '6 6' }}
        />
      )}

      {/* Requesting hospital / patient */}
      <Marker position={[hospital.lat, hospital.lng]} icon={HOSPITAL_PIN}>
        <Tooltip>{hospital.name}</Tooltip>
        <Popup>
          <strong>{hospital.name}</strong>
          <br />
          Patient / requesting hospital
        </Popup>
      </Marker>

      {/* Matched blood banks */}
      {bankPoints.map((m) => {
        const isActive = activeMatch && activeMatch.bankId === m.bankId;
        return (
          <Marker
            key={`bank-${m.bankId}`}
            position={[m.lat, m.lng]}
            icon={isActive ? ACTIVE_BANK_PIN : BANK_PIN}
          >
            <Popup>
              <strong>{m.bankName}</strong>
              <br />
              {m.availableUnits} units of {m.bloodGroup}
              <br />
              {m.distance} km • score {m.score}
              {isActive ? ' • current source' : ''}
            </Popup>
          </Marker>
        );
      })}

      {/* Volunteer donors */}
      {donorPoints.map((d) => (
        <Marker key={`donor-${d.id}`} position={[d.lat, d.lng]} icon={DONOR_PIN}>
          <Popup>
            <strong>
              {d.name} ({d.bloodGroup})
            </strong>
            <br />
            {d.distance} km • {d.phone}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
