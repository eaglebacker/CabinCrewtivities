const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { notifyNewActivity } = require('../services/email');

const router = express.Router();

// List all activities with average ratings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.*,
        u.display_name as creator_name,
        COALESCE(AVG(v.rating), 0) as avg_rating,
        COUNT(v.id) as vote_count
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN votes v ON a.id = v.activity_id
      GROUP BY a.id, u.display_name
      ORDER BY avg_rating DESC, a.created_at DESC
    `);

    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      eventDate: row.event_date,
      eventTime: row.event_time,
      links: row.links ? JSON.parse(row.links) : [],
      createdBy: { id: row.created_by, displayName: row.creator_name },
      avgRating: parseFloat(row.avg_rating) || 0,
      voteCount: parseInt(row.vote_count) || 0,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error('List activities error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, location, eventDate, eventTime, links } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Activity name required' });
    }

    const linksJson = links ? JSON.stringify(links) : null;

    const result = await db.query(`
      INSERT INTO activities (name, description, location, event_date, event_time, links, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, location, eventDate, eventTime, linksJson, req.user.userId]);

    const activity = result.rows[0];

    // EMAIL NOTIFICATIONS - Uncomment when domain is verified in Resend
    // notifyNewActivity(db, activity, req.user.displayName).catch(err => {
    //   console.error('Failed to send activity notifications:', err);
    // });

    res.status(201).json({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      location: activity.location,
      eventDate: activity.event_date,
      eventTime: activity.event_time,
      links: activity.links ? JSON.parse(activity.links) : [],
      createdAt: activity.created_at
    });
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single activity with details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.*,
        u.display_name as creator_name,
        COALESCE(AVG(v.rating), 0) as avg_rating,
        COUNT(v.id) as vote_count
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN votes v ON a.id = v.activity_id
      WHERE a.id = $1
      GROUP BY a.id, u.display_name
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const row = result.rows[0];

    // Get who's available on this date if event_date is set
    let availableUsers = [];
    if (row.event_date) {
      const availResult = await db.query(`
        SELECT u.id, u.display_name
        FROM availability av
        JOIN users u ON av.user_id = u.id
        WHERE av.date = $1 AND av.is_available = true
      `, [row.event_date]);
      availableUsers = availResult.rows.map(r => ({ id: r.id, displayName: r.display_name }));
    }

    res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      eventDate: row.event_date,
      eventTime: row.event_time,
      links: row.links ? JSON.parse(row.links) : [],
      createdBy: { id: row.created_by, displayName: row.creator_name },
      avgRating: parseFloat(row.avg_rating) || 0,
      voteCount: parseInt(row.vote_count) || 0,
      availableUsers,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update activity (creator or admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, location, eventDate, eventTime, links } = req.body;

    // Check ownership
    const check = await db.query('SELECT created_by FROM activities WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (check.rows[0].created_by !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const linksJson = links ? JSON.stringify(links) : null;

    const result = await db.query(`
      UPDATE activities
      SET name = $1, description = $2, location = $3, event_date = $4, event_time = $5, links = $6
      WHERE id = $7
      RETURNING *
    `, [name, description, location, eventDate, eventTime, linksJson, req.params.id]);

    const activity = result.rows[0];
    res.json({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      location: activity.location,
      eventDate: activity.event_date,
      eventTime: activity.event_time,
      links: activity.links ? JSON.parse(activity.links) : []
    });
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete activity (creator or admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const check = await db.query('SELECT created_by FROM activities WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (check.rows[0].created_by !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM activities WHERE id = $1', [req.params.id]);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote on activity
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    // Check activity exists
    const check = await db.query('SELECT id FROM activities WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await db.query(`
      INSERT INTO votes (activity_id, user_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (activity_id, user_id) DO UPDATE SET rating = $3
    `, [req.params.id, req.user.userId, rating]);

    // Return updated average
    const avgResult = await db.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as vote_count
      FROM votes WHERE activity_id = $1
    `, [req.params.id]);

    res.json({
      rating,
      avgRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
      voteCount: parseInt(avgResult.rows[0].vote_count) || 0
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my vote for an activity
router.get('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT rating FROM votes WHERE activity_id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    res.json({ rating: result.rows[0]?.rating || null });
  } catch (err) {
    console.error('Get vote error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
