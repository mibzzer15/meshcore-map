const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/nodes — all Bay Area nodes from cache
router.get('/', (req, res) => {
  const nodes = db.prepare('SELECT * FROM nodes ORDER BY last_heard DESC').all();
  res.json(nodes);
});

// GET /api/nodes/:id — single node
router.get('/:id', (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  res.json(node);
});

module.exports = router;
