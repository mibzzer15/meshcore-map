const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/nodes', require('./routes/nodes'));

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Start sync scheduler
require('./sync');

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
