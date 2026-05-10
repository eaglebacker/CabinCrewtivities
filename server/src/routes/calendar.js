const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get availability for a month
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { month } = req.query; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month required in YYYY-MM format' });
    }

    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0];

    const result = await db.query(`
      SELECT a.date, a.is_available, u.id as user_id, u.display_name
      FROM availability a
      JOIN users u ON a.user_id = u.id
      WHERE a.date >= $1 AND a.date <= $2 AND a.is_available = true
      ORDER BY a.date
    `, [startDate, endDate]);

    // Group by date
    const availability = {};
    result.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!availability[dateStr]) {
        availability[dateStr] = [];
      }
      availability[dateStr].push({
        userId: row.user_id,
        displayName: row.display_name
      });
    });

    res.json(availability);
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set availability for a date
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, isAvailable } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date required' });
    }

    if (isAvailable) {
      await db.query(`
        INSERT INTO availability (user_id, date, is_available)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id, date) DO UPDATE SET is_available = true
      `, [req.user.userId, date]);
    } else {
      await db.query(
        'DELETE FROM availability WHERE user_id = $1 AND date = $2',
        [req.user.userId, date]
      );
    }

    res.json({ date, isAvailable: !!isAvailable });
  } catch (err) {
    console.error('Set availability error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my availability for a month
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month required in YYYY-MM format' });
    }

    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0];

    const result = await db.query(`
      SELECT date FROM availability
      WHERE user_id = $1 AND date >= $2 AND date <= $3 AND is_available = true
    `, [req.user.userId, startDate, endDate]);

    const dates = result.rows.map(row => row.date.toISOString().split('T')[0]);
    res.json(dates);
  } catch (err) {
    console.error('Get my availability error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
