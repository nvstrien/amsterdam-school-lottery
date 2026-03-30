const Redis = require('ioredis');

let redis;
function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { advies, list, sessionId, timeToComplete, ts } = req.body;

  // Validate required fields
  if (!advies || !Array.isArray(list) || !list.length || !sessionId) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Validate list contains only numbers (department IDs)
  if (!list.every(id => Number.isInteger(id) && id >= 0 && id <= 200)) {
    return res.status(400).json({ error: 'Invalid list entries' });
  }

  const entry = {
    advies,
    list,
    timeToComplete: timeToComplete || 0,
    ts: ts || Date.now()
  };

  const db = getRedis();

  // Store with sessionId as key (auto-dedup: re-submission overwrites)
  await db.set(`list:${sessionId}`, JSON.stringify(entry));

  // Track session ID for enumeration
  await db.sadd('sessions', sessionId);

  return res.status(200).json({ ok: true });
};
