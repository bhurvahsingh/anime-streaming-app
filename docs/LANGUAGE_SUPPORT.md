# Language & Dub Support

The AnimeHub streaming app supports multiple languages and audio versions for anime content.

## Supported Languages & Dubs

### English
- **English (Subtitle)** - Original Japanese audio with English subtitles
- **English (Dub)** - English dubbed audio

### Hindi
- **Hindi (Dub)** - Hindi dubbed audio

### Japanese
- **Japanese (Subtitle)** - Original Japanese with no subtitles

## How to Use

### Changing Language/Dub

1. Go to Settings (⚙️ icon on profile page)
2. Select your preferred language from dropdown
3. Choose between "Subtitle" or "Dubbed"
4. Save preferences

### API Endpoints

#### Get Available Languages
```bash
GET /api/languages/:episodeId/languages
```

Response:
```json
[
  {
    "language": "english",
    "dubs": ["sub", "dub"]
  },
  {
    "language": "hindi",
    "dubs": ["dub"]
  },
  {
    "language": "japanese",
    "dubs": ["sub"]
  }
]
```

#### Get Video Source
```bash
GET /api/languages/:episodeId/source?language=english&dub_type=sub&quality=720
```

#### Get Quality Options
```bash
GET /api/languages/:episodeId/qualities?language=english&dub_type=sub
```

#### Stream Video
```bash
GET /api/stream/video/:episodeId?language=english&dub_type=sub&quality=720
```

## Database Schema

### Video Sources Table
Stores different language/dub versions for each episode.

```sql
CREATE TABLE video_sources (
  id SERIAL PRIMARY KEY,
  episode_id INTEGER,
  language VARCHAR(50),      -- 'english', 'hindi', 'japanese'
  dub_type VARCHAR(50),      -- 'dub', 'sub'
  video_file VARCHAR(500),
  quality VARCHAR(20),       -- '480', '720', '1080'
  file_size INTEGER,
  duration_seconds INTEGER
);
```

### User Preferences
Stores user's language preferences.

```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  preferred_language VARCHAR(50),   -- Default: 'english'
  preferred_dub_type VARCHAR(50),   -- Default: 'sub'
  default_quality VARCHAR(20),      -- Default: '720'
);
```

### Watch Progress
Tracks which language/dub the user watched.

```sql
CREATE TABLE watch_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  episode_id INTEGER,
  video_source_id INTEGER,
  progress_seconds INTEGER,
  preferred_language VARCHAR(50),
  preferred_dub_type VARCHAR(50)
);
```

## Implementation Examples

### JavaScript Frontend

```javascript
// Get available languages
async function getLanguages(episodeId) {
  const res = await fetch(`/api/languages/${episodeId}/languages`);
  return await res.json();
}

// Stream with specific language/dub
function streamVideo(episodeId, language, dubType, quality) {
  return `/api/stream/video/${episodeId}?language=${language}&dub_type=${dubType}&quality=${quality}`;
}

// Save progress with language preference
async function saveProgress(episodeId, progress, language, dubType) {
  await fetch(`/api/user/progress/${episodeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      progress,
      language,
      dub_type: dubType
    })
  });
}
```

## Adding New Languages

To add support for a new language:

1. Insert video files into `uploads/videos/` with naming convention:
   `{anime-title}_ep{number}_{language}_{dubtype}_{quality}.mp4`

2. Add to database:
   ```sql
   INSERT INTO video_sources (episode_id, language, dub_type, video_file, quality, file_size, duration_seconds)
   VALUES (1, 'korean', 'sub', 'anime_ep1_korean_sub_720.mp4', '720', 500000000, 1440);
   ```

3. Update frontend language selector in `public/index.html`

## Performance Optimization

- **Language Fallback**: If selected language/dub unavailable, automatically falls back to available options
- **Quality Selection**: Automatically downgrades quality on slow connections
- **Caching**: Popular language/dub combinations cached in Redis
- **Lazy Loading**: Language options loaded only when needed

## Troubleshooting

### Video not playing in selected language
- Check if language/dub combination exists in database
- Verify video file exists in uploads folder
- Check file permissions

### Wrong audio/subtitle showing
- Clear browser cache
- Update user preferences
- Try different quality option

### Slow loading
- Check network speed
- Switch to lower quality
- Clear Redis cache: `redis-cli FLUSHALL`
