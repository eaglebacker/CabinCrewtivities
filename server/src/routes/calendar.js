const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { notifyEventScheduled } = require('../services/email');

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

// Get events for a month (with RSVPs)
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month required in YYYY-MM format' });
    }

    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0];

    // Get events
    const eventsResult = await db.query(`
      SELECT ce.id, ce.date, ce.activity_id, a.name as activity_name,
             u.display_name as created_by_name, ce.created_by
      FROM calendar_events ce
      JOIN activities a ON ce.activity_id = a.id
      JOIN users u ON ce.created_by = u.id
      WHERE ce.date >= $1 AND ce.date <= $2
      ORDER BY ce.date, a.name
    `, [startDate, endDate]);

    // Get RSVPs for these events
    const eventIds = eventsResult.rows.map(r => r.id);
    let rsvpsByEvent = {};

    if (eventIds.length > 0) {
      const rsvpsResult = await db.query(`
        SELECT er.event_id, er.user_id, er.status, u.display_name
        FROM event_rsvps er
        JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ANY($1)
      `, [eventIds]);

      rsvpsResult.rows.forEach(row => {
        if (!rsvpsByEvent[row.event_id]) {
          rsvpsByEvent[row.event_id] = { attending: [], declined: [] };
        }
        rsvpsByEvent[row.event_id][row.status].push({
          userId: row.user_id,
          displayName: row.display_name
        });
      });
    }

    // Get current user's RSVPs
    const myRsvpsResult = await db.query(`
      SELECT event_id, status FROM event_rsvps WHERE user_id = $1
    `, [req.user.userId]);

    const myRsvps = {};
    myRsvpsResult.rows.forEach(row => {
      myRsvps[row.event_id] = row.status;
    });

    // Group by date
    const events = {};
    eventsResult.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!events[dateStr]) {
        events[dateStr] = [];
      }
      const eventRsvps = rsvpsByEvent[row.id] || { attending: [], declined: [] };
      events[dateStr].push({
        id: row.id,
        activityId: row.activity_id,
        activityName: row.activity_name,
        createdBy: { id: row.created_by, displayName: row.created_by_name },
        rsvps: eventRsvps,
        myRsvp: myRsvps[row.id] || null
      });
    });

    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add event to calendar
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { activityId, date, days } = req.body;

    if (!activityId || !date) {
      return res.status(400).json({ error: 'Activity ID and date required' });
    }

    // Check activity exists
    const activityCheck = await db.query('SELECT id, name FROM activities WHERE id = $1', [activityId]);
    if (activityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const numDays = days || 1;
    const createdEvents = [];

    for (let i = 0; i < numDays; i++) {
      const eventDate = new Date(date);
      eventDate.setDate(eventDate.getDate() + i);
      const dateStr = eventDate.toISOString().split('T')[0];

      try {
        const result = await db.query(`
          INSERT INTO calendar_events (activity_id, date, created_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (activity_id, date) DO NOTHING
          RETURNING id
        `, [activityId, dateStr, req.user.userId]);

        if (result.rows.length > 0) {
          createdEvents.push({ id: result.rows[0].id, date: dateStr });
        }
      } catch (e) {
        // Skip duplicates
      }
    }

    // EMAIL NOTIFICATIONS - Uncomment when domain is verified in Resend
    // if (createdEvents.length > 0) {
    //   notifyEventScheduled(db, {
    //     activity_name: activityCheck.rows[0].name,
    //     date: date,
    //     created_by: req.user.userId
    //   }, req.user.displayName).catch(err => {
    //     console.error('Failed to send event notifications:', err);
    //   });
    // }

    res.status(201).json({
      activityId,
      activityName: activityCheck.rows[0].name,
      events: createdEvents
    });
  } catch (err) {
    console.error('Add event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event from calendar
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM calendar_events WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event removed' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// RSVP to an event
router.post('/events/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const eventId = req.params.id;

    if (!status || !['attending', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "attending" or "declined"' });
    }

    // Check event exists
    const eventCheck = await db.query('SELECT id FROM calendar_events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.query(`
      INSERT INTO event_rsvps (event_id, user_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3
    `, [eventId, req.user.userId, status]);

    res.json({ eventId: parseInt(eventId), status });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove RSVP from an event
router.delete('/events/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'RSVP removed' });
  } catch (err) {
    console.error('Remove RSVP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
