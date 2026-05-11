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

// Get current user's settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT email_notifications FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      emailNotifications: result.rows[0].email_notifications
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current user's settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    await db.query(
      'UPDATE users SET email_notifications = $1 WHERE id = $2',
      [emailNotifications, req.userId]
    );

    res.json({ success: true, emailNotifications });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
