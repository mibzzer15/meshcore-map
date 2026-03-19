import React, { useState } from 'react';

export default function NodePicker({ nodes, onClose, onChanged }) {
  const [search, setSearch] = useState('');
  const [editNode, setEditNode] = useState(null);
  const [saving, setSaving] = useState(null);

  const filtered = nodes.filter(n =>
    (n.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.hardware || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleMine = async (node) => {
    setSaving(node.id);
    const method = node.is_mine ? 'DELETE' : 'POST';
    await fetch(`/api/nodes/${node.id}/mine`, { method });
    setSaving(null);
    onChanged();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Select My Repeaters</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <input
          style={styles.search}
          placeholder="Search by name or hardware..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div style={styles.list}>
          {filtered.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No nodes found</p>
          )}
          {filtered.map(node => (
            <div key={node.id} style={{ ...styles.row, background: node.is_mine ? '#0f3460' : 'transparent' }}>
              <div style={styles.nodeInfo}>
                <span style={styles.nodeName}>{node.name || 'Unknown'}</span>
                <span style={styles.nodeMeta}>
                  {node.hardware || 'Unknown HW'}
                  {node.last_heard && ` · ${new Date(node.last_heard).toLocaleDateString()}`}
                </span>
              </div>
              <div style={styles.actions}>
                {node.is_mine && (
                  <button
                    style={styles.detailsBtn}
                    onClick={() => setEditNode(node)}
                  >
                    Details
                  </button>
                )}
                <button
                  style={node.is_mine ? styles.removeBtn : styles.addBtn}
                  disabled={saving === node.id}
                  onClick={() => toggleMine(node)}
                >
                  {saving === node.id ? '...' : node.is_mine ? 'Remove' : 'Add'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <span style={{ color: '#aaa', fontSize: 13 }}>
            {nodes.filter(n => n.is_mine).length} repeater(s) selected
          </span>
          <button style={styles.doneBtn} onClick={onClose}>Done</button>
        </div>
      </div>

      {editNode && (
        <DetailsForm
          node={editNode}
          onClose={() => setEditNode(null)}
          onSaved={() => { setEditNode(null); onChanged(); }}
        />
      )}
    </div>
  );
}

function DetailsForm({ node, onClose, onSaved }) {
  const [form, setForm] = useState({
    callsign: node.callsign || '',
    frequency: node.frequency || '',
    offset: node.offset || '',
    ctcss: node.ctcss || '',
    dcs: node.dcs || '',
    power_watts: node.power_watts || '',
    notes: node.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/nodes/${node.id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          frequency: form.frequency ? parseFloat(form.frequency) : null,
          offset: form.offset ? parseFloat(form.offset) : null,
          power_watts: form.power_watts ? parseInt(form.power_watts) : null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.panel, maxWidth: 420 }}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Details — {node.name}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
          <Field label="Callsign" value={form.callsign} onChange={set('callsign')} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Frequency (MHz)" value={form.frequency} onChange={set('frequency')} type="number" step="any" />
            <Field label="Offset (MHz)" value={form.offset} onChange={set('offset')} type="number" step="any" placeholder="-0.6 or +0.6" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="CTCSS (Hz)" value={form.ctcss} onChange={set('ctcss')} placeholder="e.g. 100.0" />
            <Field label="DCS" value={form.dcs} onChange={set('dcs')} placeholder="e.g. 023" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Power (W)" value={form.power_watts} onChange={set('power_watts')} type="number" />
          </div>
          <Field label="Notes" value={form.notes} onChange={set('notes')} multiline />
          {error && <p style={{ color: '#f44336', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', step, placeholder, multiline }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {multiline ? (
        <textarea value={value ?? ''} onChange={onChange} rows={3} style={styles.input} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ''} onChange={onChange} step={step} placeholder={placeholder} style={styles.input} />
      )}
    </label>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  panel: {
    background: '#1a1a2e', border: '1px solid #444', borderRadius: 8,
    width: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #333',
  },
  closeBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer' },
  search: {
    margin: '12px 20px', padding: '8px 12px', background: '#0f3460',
    border: '1px solid #444', borderRadius: 4, color: '#fff', fontSize: 14,
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 12px' },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 8px', borderRadius: 4, marginBottom: 2,
  },
  nodeInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  nodeName: { fontSize: 14, color: '#fff', fontWeight: 500 },
  nodeMeta: { fontSize: 12, color: '#888' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  addBtn: {
    background: '#e94560', color: '#fff', border: 'none', borderRadius: 4,
    padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
  },
  removeBtn: {
    background: 'none', color: '#f44336', border: '1px solid #f44336',
    borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
  },
  detailsBtn: {
    background: 'none', color: '#aaa', border: '1px solid #555',
    borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 13,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', borderTop: '1px solid #333',
  },
  doneBtn: {
    background: '#0f3460', color: '#fff', border: '1px solid #444',
    borderRadius: 4, padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold',
  },
  input: {
    background: '#0f3460', border: '1px solid #444', borderRadius: 4,
    color: '#fff', padding: '8px 10px', fontSize: 14, width: '100%',
  },
  saveBtn: {
    background: '#e94560', color: '#fff', border: 'none',
    borderRadius: 4, padding: '9px 20px', cursor: 'pointer', fontWeight: 'bold',
  },
  cancelBtn: {
    background: 'none', color: '#aaa', border: '1px solid #555',
    borderRadius: 4, padding: '9px 16px', cursor: 'pointer',
  },
};
