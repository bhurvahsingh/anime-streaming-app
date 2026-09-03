const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const router = express.Router();

// Advanced streaming with adaptive bitrate
router.get('/adaptive/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english', dub_type = 'sub' } = req.query;
    const bandwidth = req.headers['bandwidth'] || '1500'; // Estimated bandwidth in kbps

    // Determine best quality based on bandwidth
    let quality = '480';
    if (bandwidth > 5000) quality = '1080';
    else if (bandwidth > 2500) quality = '720';

    const result = await pool.query(
      `SELECT * FROM video_sources
       WHERE episode_id = $1 AND language = $2 AND dub_type = $3 AND quality = $4
       LIMIT 1`,
      [episodeId, language, dub_type, quality]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not available' });
    }

    const videoSource = result.rows[0];
    const videoPath = path.join(process.env.VIDEO_UPLOAD_DIR || './uploads/videos', videoSource.video_file);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${videoSource.video_file}"`
      });

      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${videoSource.video_file}"`
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Adaptive stream error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

// Get subtitle file (if available)
router.get('/subtitles/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english' } = req.query;

    const result = await pool.query(
      `SELECT subtitle_file FROM language_tracks
       WHERE episode_id = $1 AND language = $2 AND track_type = 'subtitle'
       LIMIT 1`,
      [episodeId, language]
    );

    if (result.rows.length === 0 || !result.rows[0].subtitle_file) {
      return res.status(404).json({ error: 'Subtitle not available' });
    }

    const subtitlePath = path.join(
      process.env.VIDEO_UPLOAD_DIR || './uploads/videos',
      result.rows[0].subtitle_file
    );

    if (!fs.existsSync(subtitlePath)) {
      return res.status(404).json({ error: 'Subtitle file not found' });
    }

    res.sendFile(subtitlePath);
  } catch (err) {
    console.error('Subtitle error:', err);
    res.status(500).json({ error: 'Failed to fetch subtitle' });
  }
});

module.exports = router;