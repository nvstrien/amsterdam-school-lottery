const Redis = require('ioredis');

let redis;
function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

module.exports = async function handler(req, res) {
  // Simple token check — set ADMIN_TOKEN in Vercel env vars
  const token = req.headers['authorization'];
  if (!process.env.ADMIN_TOKEN || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getRedis();
  const sessionIds = await db.smembers('sessions');

  if (!sessionIds.length) {
    return res.status(200).json({ count: 0, lists: [] });
  }

  const keys = sessionIds.map(id => `list:${id}`);
  const values = await db.mget(...keys);

  const lists = sessionIds
    .map((id, i) => { try { const d = JSON.parse(values[i]); d.sessionId = id; return d; } catch (e) { return null; } })
    .filter(Boolean);

  return res.status(200).json({ count: lists.length, lists });
};
