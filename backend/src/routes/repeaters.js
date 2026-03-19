const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/repeaters — all my repeaters
router.get('/', (req, res) => {
  const repeaters = db.prepare('SELECT * FROM my_repeaters ORDER BY name').all();
  res.json(repeaters);
});

// GET /api/repeaters/:id
router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM my_repeaters WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

// POST /api/repeaters — add a repeater
router.post('/', (req, res) => {
  const {
    name, callsign, lat, lng, frequency, offset,
    ctcss, dcs, power_watts, hardware, notes, node_id
  } = req.body;

  if (!name || lat == null || lng == null) {
    return res.status(400).json({ error: 'name, lat, and lng are required' });
  }

  const result = db.prepare(`
    INSERT INTO my_repeaters
      (name, callsign, lat, lng, frequency, offset, ctcss, dcs, power_watts, hardware, notes, node_id)
    VALUES
      (@name, @callsign, @lat, @lng, @frequency, @offset, @ctcss, @dcs, @power_watts, @hardware, @notes, @node_id)
  `).run({ name, callsign, lat, lng, frequency, offset, ctcss, dcs, power_watts, hardware, notes, node_id });

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/repeaters/:id — update a repeater
router.put('/:id', (req, res) => {
  const {
    name, callsign, lat, lng, frequency, offset,
    ctcss, dcs, power_watts, hardware, notes, node_id
  } = req.body;

  const result = db.prepare(`
    UPDATE my_repeaters SET
      name = @name, callsign = @callsign, lat = @lat, lng = @lng,
      frequency = @frequency, offset = @offset, ctcss = @ctcss, dcs = @dcs,
      power_watts = @power_watts, hardware = @hardware, notes = @notes,
      node_id = @node_id, updated_at = datetime('now')
    WHERE id = @id
  `).run({ name, callsign, lat, lng, frequency, offset, ctcss, dcs, power_watts, hardware, notes, node_id, id: req.params.id });

  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/repeaters/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM my_repeaters WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
