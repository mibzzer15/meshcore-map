import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RepeaterPanel from './components/RepeaterPanel';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MY_REPEATER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// SF Bay Area center
const BAY_CENTER = [37.7749, -122.4194];

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [repeaters, setRepeaters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [editRepeater, setEditRepeater] = useState(null);

  useEffect(() => {
    fetch('/api/nodes').then(r => r.json()).then(setNodes).catch(console.error);
    fetch('/api/repeaters').then(r => r.json()).then(setRepeaters).catch(console.error);
  }, []);

  const refreshRepeaters = () =>
    fetch('/api/repeaters').then(r => r.json()).then(setRepeaters);

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={styles.header}>
        <h1 style={styles.title}>MeshCore Bay Area</h1>
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#2196f3' }} /> Community nodes ({nodes.length})
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#f44336' }} /> My repeaters ({repeaters.length})
          </span>
        </div>
        <button style={styles.btn} onClick={() => { setEditRepeater(null); setShowPanel(true); }}>
          + Add Repeater
        </button>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={BAY_CENTER} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {nodes.map(node => (
            <Marker key={node.id} position={[node.lat, node.lng]}>
              <Popup>
                <strong>{node.name || 'Unknown'}</strong><br />
                Hardware: {node.hardware || 'N/A'}<br />
                Firmware: {node.firmware || 'N/A'}<br />
                Last heard: {node.last_heard ? new Date(node.last_heard).toLocaleString() : 'N/A'}
              </Popup>
            </Marker>
          ))}

          {repeaters.map(r => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={MY_REPEATER_ICON}>
              <Popup>
                <strong>{r.name}</strong> {r.callsign && `(${r.callsign})`}<br />
                {r.frequency && <>Freq: {r.frequency} MHz {r.offset && `(${r.offset > 0 ? '+' : ''}{r.offset})`}<br /></>}
                {r.ctcss && <>CTCSS: {r.ctcss} Hz<br /></>}
                {r.dcs && <>DCS: {r.dcs}<br /></>}
                {r.power_watts && <>Power: {r.power_watts}W<br /></>}
                {r.hardware && <>HW: {r.hardware}<br /></>}
                {r.notes && <><em>{r.notes}</em><br /></>}
                <button
                  style={{ marginTop: 6, fontSize: 12 }}
                  onClick={() => { setEditRepeater(r); setShowPanel(true); }}
                >
                  Edit
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {showPanel && (
        <RepeaterPanel
          repeater={editRepeater}
          onClose={() => setShowPanel(false)}
          onSaved={() => { setShowPanel(false); refreshRepeaters(); }}
        />
      )}
    </div>
  );
}

const styles = {
  header: {
    background: '#0f3460',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  title: { fontSize: 18, color: '#fff', whiteSpace: 'nowrap' },
  legend: { display: 'flex', gap: 16, flex: 1 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ccc' },
  dot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  btn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
};
