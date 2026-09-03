const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get available languages and dub types for an episode
router.get('/:episodeId/languages', async (req, res) => {
  try {
    const { episodeId } = req.params;

    const result = await pool.query(
      `SELECT DISTINCT language, dub_type, quality
       FROM video_sources
       WHERE episode_id = $1
       ORDER BY language ASC, dub_type ASC`,
      [episodeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No video sources available' });
    }

    // Group by language
    const groupedLanguages = {};
    result.rows.forEach(row => {
      if (!groupedLanguages[row.language]) {
        groupedLanguages[row.language] = {
          language: row.language,
          dubs: []
        };
      }
      if (!groupedLanguages[row.language].dubs.includes(row.dub_type)) {
        groupedLanguages[row.language].dubs.push(row.dub_type);
      }
    });

    res.json(Object.values(groupedLanguages));
  } catch (err) {
    console.error('Error fetching languages:', err);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get video source for specific language/dub
router.get('/:episodeId/source', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english', dub_type = 'sub', quality = '720' } = req.query;

    // Try exact match first
    let result = await pool.query(
      `SELECT * FROM video_sources
       WHERE episode_id = $1 AND language = $2 AND dub_type = $3 AND quality = $4
       LIMIT 1`,
      [episodeId, language, dub_type, quality]
    );

    // Fallback to default quality if exact quality not found
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT * FROM video_sources
         WHERE episode_id = $1 AND language = $2 AND dub_type = $3
         ORDER BY quality DESC
         LIMIT 1`,
        [episodeId, language, dub_type]
      );
    }

    // Fallback to any available version
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT * FROM video_sources
         WHERE episode_id = $1
         ORDER BY language ASC, dub_type ASC, quality DESC
         LIMIT 1`,
        [episodeId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video source not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching video source:', err);
    res.status(500).json({ error: 'Failed to fetch video source' });
  }
});

// Get video quality options for language/dub
router.get('/:episodeId/qualities', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english', dub_type = 'sub' } = req.query;

    const result = await pool.query(
      `SELECT DISTINCT quality, file_size, duration_seconds
       FROM video_sources
       WHERE episode_id = $1 AND language = $2 AND dub_type = $3
       ORDER BY quality DESC`,
      [episodeId, language, dub_type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No video sources available' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching qualities:', err);
    res.status(500).json({ error: 'Failed to fetch qualities' });
  }
});

module.exports = router;
