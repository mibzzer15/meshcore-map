import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import NodePicker from './components/NodePicker';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MY_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const BAY_CENTER = [37.7749, -122.4194];

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const loadNodes = useCallback(() => {
    fetch('/api/nodes').then(r => r.json()).then(setNodes).catch(console.error);
  }, []);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const myNodes = nodes.filter(n => n.is_mine);
  const communityNodes = nodes.filter(n => !n.is_mine);

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={styles.header}>
        <h1 style={styles.title}>MeshCore Bay Area</h1>
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#2196f3' }} />
            Community nodes ({communityNodes.length})
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#f44336' }} />
            My repeaters ({myNodes.length})
          </span>
        </div>
        <button style={styles.btn} onClick={() => setShowPicker(true)}>
          Manage My Repeaters
        </button>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={BAY_CENTER} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {communityNodes.map(node => (
            <Marker key={node.id} position={[node.lat, node.lng]}>
              <Popup>
                <strong>{node.name || 'Unknown'}</strong><br />
                Hardware: {node.hardware || 'N/A'}<br />
                Firmware: {node.firmware || 'N/A'}<br />
                Last heard: {node.last_heard ? new Date(node.last_heard).toLocaleString() : 'N/A'}
              </Popup>
            </Marker>
          ))}

          {myNodes.map(node => (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={MY_ICON}>
              <Popup>
                <strong>{node.name || 'Unknown'}</strong>
                {node.callsign && ` (${node.callsign})`}<br />
                Hardware: {node.hardware || 'N/A'}<br />
                {node.frequency && <>Freq: {node.frequency} MHz{node.offset ? ` (${node.offset > 0 ? '+' : ''}${node.offset})` : ''}<br /></>}
                {node.ctcss && <>CTCSS: {node.ctcss} Hz<br /></>}
                {node.dcs && <>DCS: {node.dcs}<br /></>}
                {node.power_watts && <>Power: {node.power_watts}W<br /></>}
                Last heard: {node.last_heard ? new Date(node.last_heard).toLocaleString() : 'N/A'}<br />
                {node.notes && <><em>{node.notes}</em><br /></>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {showPicker && (
        <NodePicker
          nodes={nodes}
          onClose={() => setShowPicker(false)}
          onChanged={loadNodes}
        />
      )}
    </div>
  );
}

const styles = {
  header: {
    background: '#0f3460', padding: '10px 20px',
    display: 'flex', alignItems: 'center', gap: 20,
  },
  title: { fontSize: 18, color: '#fff', whiteSpace: 'nowrap' },
  legend: { display: 'flex', gap: 16, flex: 1 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ccc' },
  dot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  btn: {
    background: '#e94560', color: '#fff', border: 'none', borderRadius: 4,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap',
  },
};
