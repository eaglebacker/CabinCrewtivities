const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all users (for displaying availability)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, display_name FROM users ORDER BY display_name'
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      displayName: row.display_name
    })));
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
