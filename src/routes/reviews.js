const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get reviews for an anime
router.get('/anime/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.anime_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [animeId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Post a review (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { animeId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!animeId || !rating || (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, anime_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, anime_id) DO UPDATE SET rating=$3, comment=$4
       RETURNING *`,
      [userId, animeId, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

// Get anime average rating
router.get('/:animeId/rating', async (req, res) => {
  try {
    const { animeId } = req.params;

    const result = await pool.query(
      `SELECT AVG(rating)::FLOAT as average_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE anime_id = $1`,
      [animeId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching rating:', err);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

module.exports = router;