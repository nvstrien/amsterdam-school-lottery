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

  const token = req.headers['authorization'];
  if (!process.env.ADMIN_TOKEN || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionIds } = req.body;
  if (!Array.isArray(sessionIds) || !sessionIds.length) {
    return res.status(400).json({ error: 'Provide sessionIds array' });
  }

  const db = getRedis();
  const keys = sessionIds.map(id => `list:${id}`);
  await db.del(...keys);
  await db.srem('sessions', ...sessionIds);

  return res.status(200).json({ deleted: sessionIds.length });
};
