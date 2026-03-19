import React, { useState, useEffect } from 'react';

const EMPTY = {
  name: '', callsign: '', lat: '', lng: '', frequency: '', offset: '',
  ctcss: '', dcs: '', power_watts: '', hardware: '', notes: '',
};

export default function RepeaterPanel({ repeater, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(repeater ? { ...repeater } : EMPTY);
    setError('');
  }, [repeater]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = repeater ? `/api/repeaters/${repeater.id}` : '/api/repeaters';
      const method = repeater ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          frequency: form.frequency ? parseFloat(form.frequency) : null,
          offset: form.offset ? parseFloat(form.offset) : null,
          power_watts: form.power_watts ? parseInt(form.power_watts) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this repeater?')) return;
    await fetch(`/api/repeaters/${repeater.id}`, { method: 'DELETE' });
    onSaved();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={{ margin: 0, fontSize: 16 }}>
            {repeater ? 'Edit Repeater' : 'Add Repeater'}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Name *" value={form.name} onChange={set('name')} required />
          <Field label="Callsign" value={form.callsign} onChange={set('callsign')} />
          <div style={styles.row}>
            <Field label="Latitude *" value={form.lat} onChange={set('lat')} type="number" step="any" required />
            <Field label="Longitude *" value={form.lng} onChange={set('lng')} type="number" step="any" required />
          </div>
          <div style={styles.row}>
            <Field label="Frequency (MHz)" value={form.frequency} onChange={set('frequency')} type="number" step="any" />
            <Field label="Offset (MHz)" value={form.offset} onChange={set('offset')} type="number" step="any" placeholder="-0.6 or +0.6" />
          </div>
          <div style={styles.row}>
            <Field label="CTCSS (Hz)" value={form.ctcss} onChange={set('ctcss')} placeholder="e.g. 100.0" />
            <Field label="DCS" value={form.dcs} onChange={set('dcs')} placeholder="e.g. 023" />
          </div>
          <div style={styles.row}>
            <Field label="Power (W)" value={form.power_watts} onChange={set('power_watts')} type="number" />
            <Field label="Hardware" value={form.hardware} onChange={set('hardware')} placeholder="e.g. RAK4631" />
          </div>
          <Field label="Notes" value={form.notes} onChange={set('notes')} multiline />

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            {repeater && (
              <button type="button" onClick={handleDelete} style={styles.deleteBtn}>
                Delete
              </button>
            )}
            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', step, required, placeholder, multiline }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {multiline ? (
        <textarea value={value ?? ''} onChange={onChange} rows={3} style={styles.input} placeholder={placeholder} />
      ) : (
        <input
          type={type} value={value ?? ''} onChange={onChange}
          step={step} required={required} placeholder={placeholder}
          style={styles.input}
        />
      )}
    </label>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  panel: {
    background: '#1a1a2e', border: '1px solid #444', borderRadius: 8,
    width: 480, maxHeight: '90vh', overflowY: 'auto', padding: 24,
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  label: { fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: '#0f3460', border: '1px solid #444', borderRadius: 4,
    color: '#fff', padding: '8px 10px', fontSize: 14, width: '100%',
  },
  error: { color: '#f44336', fontSize: 13 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  saveBtn: { background: '#e94560', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 20px', cursor: 'pointer', fontWeight: 'bold' },
  deleteBtn: { background: 'none', color: '#f44336', border: '1px solid #f44336', borderRadius: 4, padding: '9px 16px', cursor: 'pointer' },
};
