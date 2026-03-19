const puppeteer = require('puppeteer');
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
  console.log('[sync] Launching browser to fetch nodes from letsmesh.net...');
  let browser;
  try {
    // Use system Chromium to avoid missing library issues on Ubuntu
    const chromiumPaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    const fs = require('fs');
    const executablePath = chromiumPaths.find(p => fs.existsSync(p));

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Step 1: Load analyzer.letsmesh.net to get Cloudflare clearance cookies
    console.log('[sync] Loading analyzer page for CF clearance...');
    await page.goto('https://analyzer.letsmesh.net', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await new Promise(r => setTimeout(r, 2000));

    // Step 2: Fetch the API from within the browser context (uses CF cookies)
    console.log('[sync] Fetching nodes API from browser context...');
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('https://api.letsmesh.net/api/nodes', {
          headers: {
            'Origin': 'https://analyzer.letsmesh.net',
            'Referer': 'https://analyzer.letsmesh.net/',
          },
        });
        if (!res.ok) return { error: `HTTP ${res.status}` };
        const data = await res.json();
        return { data };
      } catch (e) {
        return { error: e.message };
      }
    });

    await browser.close();
    browser = null;

    if (result.error) {
      console.error('[sync] API fetch failed inside browser:', result.error);
      return;
    }

    const nodes = Array.isArray(result.data) ? result.data : result.data.nodes ?? [];

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
    if (browser) await browser.close().catch(() => {});
  }
}

// Run on startup, then every hour
syncNodes();
cron.schedule('0 * * * *', syncNodes);

module.exports = { syncNodes };
