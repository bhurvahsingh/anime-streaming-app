# Anime Streaming App - Complete Setup

A **lightweight, high-performance anime streaming application** optimized for low-end devices like **Redmi 6A** (1GB RAM).

## 🚀 Features

### Core Features
- 🎬 **HLS Video Streaming** - Adaptive bitrate with multiple quality options
- 👤 **User Authentication** - JWT-based secure login
- 📝 **Watchlist** - Save favorite anime
- ⏱️ **Watch Progress** - Resume from where you left off
- ⭐ **Ratings & Reviews** - Rate and comment on anime
- 🔔 **Notifications** - Stay updated on new episodes
- 📥 **Download Tracking** - Manage downloaded episodes
- 🔍 **Search & Filter** - Find anime by title, genre, year
- 💬 **Comments** - Community discussions

### Performance Features
- ⚡ **Lightweight UI** - Minimal CSS, optimized for 1GB RAM devices
- 📱 **Progressive Web App (PWA)** - Install on home screen
- 💾 **Service Worker** - Offline support and caching
- 🔄 **Redis Caching** - Fast data retrieval
- 📊 **Connection Pooling** - Efficient database usage
- 🗜️ **Response Compression** - GZIP enabled
- 📉 **Reduced Payload** - Lazy loading and image optimization

## 📋 Tech Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Cache layer
- **JWT** - Authentication

### Frontend
- **Vanilla JavaScript** - No heavy frameworks
- **HTML5** - Semantic markup
- **CSS3** - Minimal, optimized styles
- **Service Worker** - PWA support

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Alpine Linux** - Minimal base image

## 🛠️ Installation

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/bhurvahsingh/anime-streaming-app.git
cd anime-streaming-app
cp .env.example .env
docker-compose up -d
```

Access at: `http://localhost:3000`

### Option 2: Manual Setup

```bash
npm install
createdb anime_streaming
psql -U postgres -d anime_streaming -f database/schema.sql
cp .env.example .env
npm start
```

## ⚡ Optimization for Redmi 6A

### Memory Optimization
- Node.js minimal heap allocation
- Redis with 128MB max memory (LRU eviction)
- PostgreSQL connection pool (20 connections)
- Image lazy loading
- Minimal JavaScript (no frameworks)

### Network Optimization
- HLS streaming with 480p option
- GZIP compression on responses
- Service Worker caching
- Initial page < 150KB

### Performance Metrics
- Page Load: < 3 seconds on 4G
- Memory: ~80-150MB (app + db + redis)
- CPU: Optimized for dual-core

## 📡 API Endpoints

**Authentication**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login

**Anime**
- `GET /api/anime` - List anime
- `GET /api/anime/:id` - Details
- `GET /api/anime/:id/episodes` - Episodes
- `GET /api/anime/trending` - Trending
- `GET /api/anime/search/query` - Search

**Streaming**
- `GET /api/stream/video/:episodeId` - Video stream
- `GET /api/stream/playlist/:episodeId/master.m3u8` - HLS

**User** (auth required)
- `GET /api/user/profile` - Profile
- `GET /api/user/watchlist` - Watchlist
- `POST /api/user/watchlist/:animeId` - Add to watchlist
- `POST /api/user/progress/:episodeId` - Save progress

**Reviews**
- `GET /api/reviews/anime/:animeId` - Get reviews
- `POST /api/reviews/` - Post review
- `GET /api/reviews/:animeId/rating` - Average rating

**Notifications**
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

**Downloads**
- `GET /api/downloads` - Download list
- `GET /api/downloads/:id` - Download details

## 🚀 Production Deployment

```bash
# VPS with Docker
docker-compose -f docker-compose.yml up -d

# With Nginx reverse proxy
proxy_pass http://localhost:3000;
proxy_buffering off;
```

## 📱 Using on Redmi 6A

1. Open browser and go to your server
2. Menu → "Add to Home Screen"
3. Use as native app
4. Close other apps for best performance
5. Use WiFi for faster streaming

## 🔧 Environment Variables

```env
PORT=3000
NODE_ENV=production
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=yourpassword
REDIS_HOST=redis
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## 🐛 Troubleshooting

```bash
# Check server health
curl http://localhost:3000/health

# View logs
docker logs -f anime_app

# Database check
docker exec anime_db psql -U postgres -d anime_streaming -c "SELECT 1"
```

## 📝 License

MIT License

## ⚠️ Legal Notice

Ensure all hosted content complies with local laws and licensing agreements.

---

**Made for low-end device users** ❤️
