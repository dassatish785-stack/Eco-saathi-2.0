// Eco Saathi 2.0 - Neon PostgreSQL Database Adapter (Serverless HTTP SQL API)
const https = require('https');

const NEON_CONN_STR = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1xB8CRmXQryw@ep-nameless-dust-benollhl-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
// Compute host for Neon Serverless HTTP API (without -pooler)
const NEON_HOST = 'ep-nameless-dust-benollhl.c-9.us-east-2.aws.neon.tech';

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql, params });
    const options = {
      hostname: NEON_HOST,
      port: 443,
      path: '/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Neon-Connection-String': NEON_CONN_STR
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400 || json.error) {
            reject(new Error(json.message || json.error || `HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testConnection() {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version;');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db_name,
      version: res.rows[0].pg_version
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  query,
  testConnection,
  NEON_CONN_STR,
  NEON_HOST
};
