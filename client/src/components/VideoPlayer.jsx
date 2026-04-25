import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * VideoPlayer - Simplified, stable video streaming player
 * 
 * Features:
 * - No aggressive auto-switching to let user interact with CAPTCHAs or play buttons
 * - Allows manual server switching
 * - No overlays blocking the iframe
 */
const VideoPlayer = ({
  sources = [],
  title = 'Video',
  debug = false
}) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [attemptedSources, setAttemptedSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const iframeRef = useRef(null);
  
  const validSources = sources.filter(s => s?.url && typeof s.url === 'string');
  const currentSource = validSources[currentSourceIndex];

  // Manual server switch
  const handleSourceChange = (e) => {
    const newIndex = Number(e.target.value);
    setIsLoading(true);
    setCurrentSourceIndex(newIndex);
  };

  // Safety timeout for loader
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 8000); // 8 second timeout
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentSourceIndex]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = useCallback(() => {
    setAttemptedSources(prev => prev.includes(currentSourceIndex) ? prev : [...prev, currentSourceIndex]);
    setIsLoading(false);
    if (debug) console.error(`[VideoPlayer] Failed to load Server ${currentSourceIndex + 1}`);
  }, [currentSourceIndex, debug]);

  if (!validSources.length) {
    return (
      <div className="video-player-error">
        <AlertCircle size={48} style={{ marginBottom: '0.5rem' }} />
        <h3>No Video Sources</h3>
        <p>No valid video sources available.</p>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper">
      {/* Server selector */}
      {validSources.length > 1 && (
        <div className="video-player-controls">
          <label htmlFor="source-select" style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>
            Server:
          </label>
          <select
            id="source-select"
            value={currentSourceIndex}
            onChange={handleSourceChange}
            className="video-player-select"
          >
            {validSources.map((source, idx) => (
              <option key={idx} value={idx}>
                {source.name}
                {attemptedSources.includes(idx) ? ' (Failed)' : ''}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {currentSourceIndex + 1}/{validSources.length}
          </span>
        </div>
      )}

      {/* Player container */}
      <div className="video-player-container" style={{ position: 'relative', overflow: 'hidden' }}>
        {isLoading && (
          <div className="video-player-loader" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            gap: '1rem'
          }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connecting to {currentSource?.name}...</p>
          </div>
        )}
        
        {currentSource && (
          <iframe
            ref={iframeRef}
            src={currentSource.url}
            title={`${title} - ${currentSource.name}`}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="video-player-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 5,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
