const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/nodes — all Bay Area nodes with details if mine
router.get('/', (req, res) => {
  const nodes = db.prepare(`
    SELECT n.*, d.callsign, d.frequency, d.offset, d.ctcss, d.dcs, d.power_watts, d.notes
    FROM nodes n
    LEFT JOIN my_repeater_details d ON d.node_id = n.id
    ORDER BY n.is_mine DESC, n.name ASC
  `).all();
  res.json(nodes);
});

// GET /api/nodes/:id
router.get('/:id', (req, res) => {
  const node = db.prepare(`
    SELECT n.*, d.callsign, d.frequency, d.offset, d.ctcss, d.dcs, d.power_watts, d.notes
    FROM nodes n
    LEFT JOIN my_repeater_details d ON d.node_id = n.id
    WHERE n.id = ?
  `).get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  res.json(node);
});

// POST /api/nodes/:id/mine — mark node as mine
router.post('/:id/mine', (req, res) => {
  db.prepare('UPDATE nodes SET is_mine = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/nodes/:id/mine — unmark node as mine
router.delete('/:id/mine', (req, res) => {
  db.prepare('UPDATE nodes SET is_mine = 0 WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM my_repeater_details WHERE node_id = ?').run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/nodes/:id/details — save extra repeater details
router.put('/:id/details', (req, res) => {
  const { callsign, frequency, offset, ctcss, dcs, power_watts, notes } = req.body;
  db.prepare(`
    INSERT INTO my_repeater_details (node_id, callsign, frequency, offset, ctcss, dcs, power_watts, notes)
    VALUES (@node_id, @callsign, @frequency, @offset, @ctcss, @dcs, @power_watts, @notes)
    ON CONFLICT(node_id) DO UPDATE SET
      callsign = excluded.callsign,
      frequency = excluded.frequency,
      offset = excluded.offset,
      ctcss = excluded.ctcss,
      dcs = excluded.dcs,
      power_watts = excluded.power_watts,
      notes = excluded.notes,
      updated_at = datetime('now')
  `).run({ node_id: req.params.id, callsign, frequency, offset, ctcss, dcs, power_watts, notes });
  res.json({ ok: true });
});

module.exports = router;
