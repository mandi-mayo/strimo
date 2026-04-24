# HLS Video Streaming Migration Guide

## Why Upgrade to HLS?

**Current Issues with Iframe Approach:**
- ❌ Depends on third-party services
- ❌ No control over player UI
- ❌ Services can go down anytime
- ❌ Geo-blocking/rate limiting
- ❌ No analytics on your end

**HLS Advantages:**
- ✅ Direct video streaming
- ✅ Full player control
- ✅ Works offline
- ✅ Better performance
- ✅ Industry standard
- ✅ Works on all devices

---

## Step 1: Install Video.js

```bash
npm install video.js
# Optional: for better player
npm install @videojs/themes
```

---

## Step 2: Create HLS VideoPlayer Component

Replace your current VideoPlayer.jsx with this HLS version:

```javascript
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { AlertCircle } from 'lucide-react';

const VideoPlayer = ({
  sources = [], // Array of { url, type, label }
  title = 'Video',
  onPlaybackStateChange = null,
  debug = false
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    // Initialize Video.js player
    playerRef.current = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      responsive: true,
      fluid: true,
      userActions: {
        click: true,
        doubleClick: true,
      },
    });

    // Handle playback state
    playerRef.current.on('play', () => {
      if (debug) console.log('✅ Video playing');
      onPlaybackStateChange?.('playing');
    });

    playerRef.current.on('pause', () => {
      if (debug) console.log('⏸️ Video paused');
      onPlaybackStateChange?.('paused');
    });

    playerRef.current.on('error', () => {
      const errorObj = playerRef.current.error();
      if (debug) console.error('❌ Video error:', errorObj);
      setError(`Error: ${errorObj?.message || 'Unknown error'}`);
      onPlaybackStateChange?.('error');
    });

    return () => {
      playerRef.current?.dispose();
    };
  }, [onPlaybackStateChange, debug]);

  // Update video source when source changes
  useEffect(() => {
    if (!playerRef.current) return;
    if (!sources[currentSourceIndex]) return;

    const source = sources[currentSourceIndex];
    setError(null);

    if (debug) console.log(`Loading: ${source.label}`);

    playerRef.current.src({
      src: source.url,
      type: source.type || 'application/x-mpegURL', // HLS by default
    });

    playerRef.current.load();
  }, [currentSourceIndex, sources, debug]);

  if (sources.length === 0) {
    return (
      <div className="video-player-error">
        <AlertCircle size={48} />
        <h3>No Video Sources Available</h3>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper">
      {sources.length > 1 && (
        <div className="video-player-controls">
          <label htmlFor="source-select">Server:</label>
          <select
            id="source-select"
            value={currentSourceIndex}
            onChange={(e) => setCurrentSourceIndex(Number(e.target.value))}
            className="video-player-select"
          >
            {sources.map((source, idx) => (
              <option key={idx} value={idx}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="video-player-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={32} />
          <p>{error}</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => playerRef.current?.load()}
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="video-player-container" style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
```

---

## Step 3: Update CSS (if needed)

Add to your `index.css`:

```css
/* Video.js custom styles (optional) */
.vjs-default-skin {
  font-family: 'Inter', sans-serif;
}

.vjs-default-skin .vjs-control-bar {
  background-color: rgba(0, 0, 0, 0.7);
  height: 2.8em;
}

.vjs-default-skin .vjs-play-progress {
  background-color: var(--accent, #c2a878);
}

.vjs-default-skin .vjs-volume-level {
  background-color: var(--accent, #c2a878);
}

.vjs-default-skin .vjs-big-play-button {
  background-color: var(--accent, #c2a878);
}
```

---

## Step 4: Update Video Sources in Details.jsx

Change from iframe URLs to HLS sources:

```javascript
const getSources = () => {
  const tmdbId = details.tmdb_id || details.id;
  
  // HLS streaming URLs (examples - replace with your actual sources)
  return [
    {
      label: '🎬 High Quality',
      url: `https://your-hls-server.com/videos/${tmdbId}/1080p.m3u8`,
      type: 'application/x-mpegURL'
    },
    {
      label: '📺 Medium Quality',
      url: `https://your-hls-server.com/videos/${tmdbId}/720p.m3u8`,
      type: 'application/x-mpegURL'
    },
    {
      label: '🔗 Low Quality',
      url: `https://your-hls-server.com/videos/${tmdbId}/480p.m3u8`,
      type: 'application/x-mpegURL'
    }
  ];
};
```

---

## Step 5: Update VideoPlayer Usage

```javascript
<VideoPlayer
  sources={sources}
  title={details.title}
  onPlaybackStateChange={(status) => {
    setPlaybackStatus(status);
    console.log(`📊 Playback status: ${status}`);
  }}
  debug={false} // Set to true for troubleshooting
/>
```

---

## Getting HLS Video Files

### Option A: Use Existing Video APIs
Services that provide HLS streams:
- **Bunny CDN** - affordable, global CDN
- **AWS CloudFront + S3** - scalable
- **Vimeo API** - managed solution
- **Mux** - video streaming platform

### Option B: Create HLS from Video Files
Convert existing video files to HLS:

```bash
# Using FFmpeg (install separately)
ffmpeg -i input.mp4 -codec: copy -start_number 0 -hls_list_size 0 -f hls output.m3u8
```

### Option C: Use Existing HLS URLs
If your third-party providers offer HLS URLs, use them directly instead of iframes!

---

## Comparison: Iframe vs HLS

| Feature | Iframe | HLS |
|---------|--------|-----|
| Control | Limited | Full |
| UI Customization | No | Yes |
| Reliability | Depends on provider | Your control |
| Performance | Medium | Excellent |
| Offline | No | Yes |
| Analytics | No | Yes |
| Multi-bitrate | No | Yes |
| Implementation | Simple | Medium |
| Cost | Free (risky) | Varies |

---

## Testing HLS Implementation

```javascript
// In your browser console, test HLS URL:
fetch('https://your-hls-server.com/videos/123/1080p.m3u8')
  .then(r => r.text())
  .then(console.log)
```

Expected output - M3U8 playlist:
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:9.9,
segment0.ts
#EXTINF:10.0,
segment1.ts
...
```

---

## Common HLS Issues & Fixes

### Issue: CORS Error
```
Access to fetch at 'https://...' from origin 'http://localhost:3000' has been blocked
```

**Fix:** Enable CORS on HLS server
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

### Issue: Segments not loading
```
Failed to load segment0.ts
```

**Fix:** Ensure all segments exist at the URLs specified in M3U8

### Issue: Player shows black screen
```
Video element ready but no playback
```

**Fix:** Check browser console for errors, verify M3U8 format

---

## Migration Checklist

- [ ] Install video.js: `npm install video.js`
- [ ] Create new HLS VideoPlayer component
- [ ] Update Details.jsx source format to HLS
- [ ] Update CSS for Video.js styling
- [ ] Get HLS video URLs (or convert existing videos)
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Test error handling (try invalid URL)
- [ ] Test source switching
- [ ] Test fullscreen
- [ ] Deploy and monitor

---

## Expected Benefits

After migration:
- ✅ Videos load faster
- ✅ Better mobile experience
- ✅ No timeout issues
- ✅ Customizable player
- ✅ Analytics ready
- ✅ Professional appearance

---

**Recommendation:** Start with iframe fix now, plan HLS migration for next phase.
This gives you working videos immediately while planning for better long-term solution.
