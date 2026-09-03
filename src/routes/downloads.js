const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get download list
router.get('/', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const result = await pool.query(
      `SELECT id, title, status, file_size, created_at 
       FROM downloads 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching downloads:', err);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// Get download by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM downloads WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Download not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching download:', err);
    res.status(500).json({ error: 'Failed to fetch download' });
  }
});

module.exports = router;