const pool = require('../db/pool');

async function createNotification(userId, type, message, entityId = null, entityType = null) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, entity_id, entity_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, message, entityId, entityType]
  );
}

module.exports = createNotification;
