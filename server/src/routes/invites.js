const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Create invite (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const result = await db.query(
      'INSERT INTO invites (code, created_by, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [code, req.user.userId, expiresAt]
    );

    res.status(201).json({
      id: result.rows[0].id,
      code: result.rows[0].code,
      expiresAt: result.rows[0].expires_at,
      createdAt: result.rows[0].created_at
    });
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all invites (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, u.display_name as used_by_name
      FROM invites i
      LEFT JOIN users u ON i.used_by = u.id
      ORDER BY i.created_at DESC
    `);

    res.json(result.rows.map(row => ({
      id: row.id,
      code: row.code,
      usedBy: row.used_by ? { id: row.used_by, displayName: row.used_by_name } : null,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      isExpired: new Date(row.expires_at) < new Date(),
      isUsed: row.used_by !== null
    })));
  } catch (err) {
    console.error('List invites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invite (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM invites WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    res.json({ message: 'Invite deleted' });
  } catch (err) {
    console.error('Delete invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate invite code (public)
router.get('/validate/:code', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id FROM invites WHERE code = $1 AND used_by IS NULL AND expires_at > NOW()',
      [req.params.code]
    );

    res.json({ valid: result.rows.length > 0 });
  } catch (err) {
    console.error('Validate invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
