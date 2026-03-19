const fetch = require('node-fetch');
const cron = require('node-cron');
const db = require('./db');

// SF Bay Area bounding box
const BAY_AREA = {
  minLat: 36.9,
  maxLat: 38.5,
  minLng: -123.1,
  maxLng: -121.4,
};

function isInBayArea(lat, lng) {
  return (
    lat >= BAY_AREA.minLat &&
    lat <= BAY_AREA.maxLat &&
    lng >= BAY_AREA.minLng &&
    lng <= BAY_AREA.maxLng
  );
}

async function syncNodes() {
  console.log('[sync] Fetching nodes from letsmesh.net...');
  try {
    const res = await fetch('https://api.letsmesh.net/api/nodes', {
      headers: {
        'Origin': 'https://analyzer.letsmesh.net',
        'Referer': 'https://analyzer.letsmesh.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'DNT': '1',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const nodes = Array.isArray(data) ? data : data.nodes ?? [];

    const upsert = db.prepare(`
      INSERT INTO nodes (id, name, lat, lng, hardware, firmware, last_heard, raw_json, updated_at)
      VALUES (@id, @name, @lat, @lng, @hardware, @firmware, @last_heard, @raw_json, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        lat = excluded.lat,
        lng = excluded.lng,
        hardware = excluded.hardware,
        firmware = excluded.firmware,
        last_heard = excluded.last_heard,
        raw_json = excluded.raw_json,
        updated_at = excluded.updated_at
    `);

    const insertMany = db.transaction((nodes) => {
      let count = 0;
      for (const node of nodes) {
        // Field names may vary — adjust after inspecting real API response
        const lat = node.lat ?? node.latitude;
        const lng = node.lng ?? node.lon ?? node.longitude;

        if (lat == null || lng == null) continue;
        if (!isInBayArea(lat, lng)) continue;

        upsert.run({
          id: String(node.id ?? node.node_id ?? node._id),
          name: node.name ?? node.short_name ?? null,
          lat,
          lng,
          hardware: node.hardware ?? node.hw_model ?? null,
          firmware: node.firmware ?? node.firmware_version ?? null,
          last_heard: node.last_heard ?? node.last_seen ?? node.updated_at ?? null,
          raw_json: JSON.stringify(node),
          updated_at: new Date().toISOString(),
        });
        count++;
      }
      return count;
    });

    const count = insertMany(nodes);
    console.log(`[sync] Saved ${count} Bay Area nodes`);
  } catch (err) {
    console.error('[sync] Failed:', err.message);
  }
}

// Run on startup, then every hour
syncNodes();
cron.schedule('0 * * * *', syncNodes);

module.exports = { syncNodes };
