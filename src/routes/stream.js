const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Stream video with language/dub selection
router.get('/video/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english', dub_type = 'sub', quality = '720' } = req.query;

    // Get video source
    let result = await pool.query(
      `SELECT vs.* FROM video_sources vs
       WHERE vs.episode_id = $1 AND vs.language = $2 AND vs.dub_type = $3 AND vs.quality = $4
       LIMIT 1`,
      [episodeId, language, dub_type, quality]
    );

    // Fallback to default quality
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT vs.* FROM video_sources vs
         WHERE vs.episode_id = $1 AND vs.language = $2 AND vs.dub_type = $3
         ORDER BY vs.quality DESC LIMIT 1`,
        [episodeId, language, dub_type]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not available in selected language/dub' });
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
        'Content-Type': 'video/mp4'
      });

      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

// Get HLS master playlist with language variants
router.get('/playlist/:episodeId/master.m3u8', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { language = 'english', dub_type = 'sub' } = req.query;

    const playlistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
/api/stream/playlist/${episodeId}/1080p.m3u8?language=${language}&dub_type=${dub_type}
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720,CODECS="avc1.640028,mp4a.40.2"
/api/stream/playlist/${episodeId}/720p.m3u8?language=${language}&dub_type=${dub_type}
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480,CODECS="avc1.420028,mp4a.40.2"
/api/stream/playlist/${episodeId}/480p.m3u8?language=${language}&dub_type=${dub_type}
`;

    res.type('application/vnd.apple.mpegurl').send(playlistContent);
  } catch (err) {
    console.error('Playlist error:', err);
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
});

// Get quality-specific playlist
router.get('/playlist/:episodeId/:quality.m3u8', async (req, res) => {
  try {
    const { episodeId, quality } = req.params;
    const { language = 'english', dub_type = 'sub' } = req.query;

    const playlistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
/api/stream/video/${episodeId}?language=${language}&dub_type=${dub_type}&quality=${quality}
#EXT-X-ENDLIST
`;

    res.type('application/vnd.apple.mpegurl').send(playlistContent);
  } catch (err) {
    console.error('Quality playlist error:', err);
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
});

module.exports = router;