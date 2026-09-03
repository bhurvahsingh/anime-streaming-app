# Setting Up Multi-Language Support

## Directory Structure

Create the following directory structure for video files:

```
uploads/
├── videos/
│   ├── english/
│   │   ├── dub/
│   │   │   └── 720p/, 480p/, 1080p/
│   │   └── sub/
│   │       └── 720p/, 480p/, 1080p/
│   ├── hindi/
│   │   ├── dub/
│   │   │   └── 720p/, 480p/, 1080p/
│   │   └── sub/
│   │       └── 720p/, 480p/, 1080p/
│   └── japanese/
│       └── sub/
│           └── 720p/, 480p/, 1080p/
└── thumbnails/
```

## File Naming Convention

**Format**: `{anime_title}_ep{episode_number}_{language}_{dub_type}_{quality}.mp4`

**Examples**:
- `demon_slayer_ep1_english_dub_720.mp4`
- `demon_slayer_ep1_english_sub_480.mp4`
- `demon_slayer_ep1_hindi_dub_720.mp4`
- `demon_slayer_ep1_japanese_sub_720.mp4`

## Adding Video Files to Database

### Method 1: SQL Insert

```sql
-- Get anime ID
SELECT id FROM anime WHERE title = 'Demon Slayer';

-- Get episode ID
SELECT id FROM episodes WHERE anime_id = 1 AND episode_number = 1;

-- Insert video sources
INSERT INTO video_sources (episode_id, language, dub_type, video_file, quality, file_size, duration_seconds)
VALUES
  (1, 'english', 'dub', 'demon_slayer_ep1_english_dub_720.mp4', '720', 500000000, 1440),
  (1, 'english', 'sub', 'demon_slayer_ep1_english_sub_720.mp4', '720', 480000000, 1440),
  (1, 'hindi', 'dub', 'demon_slayer_ep1_hindi_dub_720.mp4', '720', 520000000, 1440),
  (1, 'japanese', 'sub', 'demon_slayer_ep1_japanese_sub_720.mp4', '720', 470000000, 1440);
```

### Method 2: Batch Upload Script

Create `scripts/upload_videos.js`:

```javascript
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const VIDEO_DIR = './uploads/videos';

// Parse filename and insert into database
async function uploadVideos() {
  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.mp4'));

  for (const file of files) {
    const parts = file.replace('.mp4', '').split('_');
    const language = parts[parts.length - 2];
    const dubType = parts[parts.length - 1];
    const quality = parts[parts.length - 1].replace('p', '');

    const stat = fs.statSync(path.join(VIDEO_DIR, file));

    await pool.query(
      `INSERT INTO video_sources (episode_id, language, dub_type, video_file, quality, file_size, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [episodeId, language, dubType, file, quality, stat.size, 1440]
    );
  }
}

uploadVideos();
```

## Video Encoding Recommendations

### For 480p (Low Quality - Redmi 6A)
```bash
ffmpeg -i input.mkv \
  -vf "scale=854:480" \
  -c:v libx264 -crf 28 -preset fast \
  -c:a aac -b:a 128k \
  output_480p.mp4
```

### For 720p (Standard Quality)
```bash
ffmpeg -i input.mkv \
  -vf "scale=1280:720" \
  -c:v libx264 -crf 23 -preset medium \
  -c:a aac -b:a 192k \
  output_720p.mp4
```

### For 1080p (High Quality)
```bash
ffmpeg -i input.mkv \
  -vf "scale=1920:1080" \
  -c:v libx264 -crf 21 -preset slow \
  -c:a aac -b:a 256k \
  output_1080p.mp4
```

### Audio Track Extraction (for Hindi Dub)
```bash
# Extract Hindi audio track
ffmpeg -i input.mkv -map 0:a:2 -c:a aac -b:a 192k hindi_audio.aac

# Combine with video
ffmpeg -i video.mp4 -i hindi_audio.aac -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 output_with_hindi.mp4
```

## Quality Settings for Low-End Devices

For Redmi 6A and similar devices, use:
- **Primary**: 480p (854x480, H.264, ~400-500MB per episode)
- **Secondary**: 720p (1280x720, H.264, ~500-700MB per episode)
- **Bitrate**: 128-192 kbps audio
- **Codec**: H.264 (best compatibility)

## Testing Language Switching

```bash
# Test getting available languages
curl http://localhost:3000/api/languages/1/languages

# Test getting English dub
curl "http://localhost:3000/api/stream/video/1?language=english&dub_type=dub&quality=720"

# Test getting Hindi dub
curl "http://localhost:3000/api/stream/video/1?language=hindi&dub_type=dub&quality=720"

# Test user preferences
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/user/preferences
```

## Database Maintenance

### Check available videos
```sql
SELECT language, dub_type, quality, COUNT(*) as count
FROM video_sources
GROUP BY language, dub_type, quality
ORDER BY language, dub_type, quality;
```

### Remove duplicate/old versions
```sql
DELETE FROM video_sources
WHERE id NOT IN (
  SELECT MIN(id) FROM video_sources
  GROUP BY episode_id, language, dub_type, quality
);
```

### Vacuum database
```bash
docker exec anime_db psql -U postgres -d anime_streaming -c "VACUUM ANALYZE;"
```
