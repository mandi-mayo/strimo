import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Zap } from 'lucide-react';

/**
 * VideoPlayer - Minimal, stable video streaming player
 *
 * Features:
 * - Smart server fallback (one pass only, no infinite retries)
 * - Fast timeout (6s) with immediate switch on failure
 * - Detects chrome-error:// and treats as hard failure
 * - Clean iframe setup, no tracking
 * - Proper error state management
 */
const VideoPlayer = ({
  sources = [],
  title = 'Video',
  onPlaybackStateChange = null,
  loadingTimeout = 6000,
  debug = false
}) => {
  // State management
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [attemptedSources, setAttemptedSources] = useState([]);
  const [sourceExhausted, setSourceExhausted] = useState(false);

  // Refs for cleanup
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Filter valid sources
  const validSources = sources.filter(s => s?.url && typeof s.url === 'string');
  const currentSource = validSources[currentSourceIndex];

  // Logging
  const log = useCallback((msg, data = null) => {
    if (debug) console.log(`[VideoPlayer] ${msg}`, data || '');
  }, [debug]);

  const logError = useCallback((msg, data = null) => {
    console.error(`[VideoPlayer] ❌ ${msg}`, data || '');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Main effect: handle source changes
  useEffect(() => {
    if (!currentSource || sourceExhausted) return;

    isUnmountedRef.current = false;
    setIsLoading(true);
    setIsPlaying(false);
    setLastError(null);

    log(`Loading source ${currentSourceIndex + 1}/${validSources.length}: ${currentSource.name}`);

    // Set timeout for this source
    timeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current && !isPlaying) {
        logError(`Timeout on Server ${currentSourceIndex + 1} (>${loadingTimeout}ms)`);
        setLastError(`Server ${currentSourceIndex + 1} timeout`);
        handleSourceFail();
      }
    }, loadingTimeout);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSourceIndex, validSources, currentSource, loadingTimeout, sourceExhausted, isPlaying, log, logError]);

  // Listen for iframe play events via postMessage
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'play' || data?.event === 'playing' || data?.status === 'playing') {
          if (!isUnmountedRef.current) {
            log('✅ Playback detected');
            setIsPlaying(true);
            setIsLoading(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            onPlaybackStateChange?.('playing');
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPlaybackStateChange, log]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    if (isUnmountedRef.current) return;

    const iframeUrl = iframeRef.current?.src || '';

    // Detect chrome-error pages (blocked/CORS/failed)
    if (iframeUrl.includes('chrome-error') || iframeUrl.startsWith('about:')) {
      logError(`Server ${currentSourceIndex + 1} returned error page`);
      setLastError(`Server ${currentSourceIndex + 1} blocked`);
      handleSourceFail();
      return;
    }

    log(`📹 Iframe loaded for Server ${currentSourceIndex + 1}`);

    // Wait for postMessage or assume ready
    const timer = setTimeout(() => {
      if (!isUnmountedRef.current && !isPlaying) {
        log('⏱️ Assuming ready (no playback event)');
        setIsPlaying(true);
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentSourceIndex, isPlaying, log, logError]);

  // Handle iframe error (network/CORS/blocked)
  const handleIframeError = useCallback(() => {
    if (isUnmountedRef.current) return;

    logError(`Failed to load Server ${currentSourceIndex + 1}: ${currentSource?.url}`);
    setLastError(`Server ${currentSourceIndex + 1} failed`);
    handleSourceFail();
  }, [currentSourceIndex, currentSource?.url, logError]);

  // Move to next server or show final error
  const handleSourceFail = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setAttemptedSources(prev => [...prev, currentSourceIndex]);

    // More servers to try?
    if (currentSourceIndex < validSources.length - 1) {
      log(`🔄 Switching to Server ${currentSourceIndex + 2}...`);
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      // All servers exhausted - STOP and show error
      logError('All video sources failed');
      setSourceExhausted(true);
      setHasError(true);
      setIsLoading(false);
      onPlaybackStateChange?.('error');
    }
  }, [currentSourceIndex, validSources.length, log, logError, onPlaybackStateChange]);

  // Manual server switch
  const handleSourceChange = (e) => {
    if (sourceExhausted) return;
    const newIndex = Number(e.target.value);
    log(`👤 User switched to Server ${newIndex + 1}`);
    setCurrentSourceIndex(newIndex);
  };

  // Retry button
  const handleRetry = useCallback(() => {
    if (isUnmountedRef.current) return;

    log(`🔄 User retry`);
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setLastError(null);
    setAttemptedSources([]);
    setSourceExhausted(false);
    setCurrentSourceIndex(0);
  }, [log]);

  // Empty sources
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
            disabled={isLoading || sourceExhausted}
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
      <div className="video-player-container">
        {/* Loading state */}
        {isLoading && !isPlaying && (
          <div className="video-player-overlay">
            <div className="spinner"></div>
            <p>Loading video...</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Trying Server {currentSourceIndex + 1} of {validSources.length}
            </span>
            {lastError && (
              <span style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '0.3rem' }}>
                {lastError}
              </span>
            )}
          </div>
        )}

        {/* Error state */}
        {hasError && sourceExhausted && (
          <div className="video-player-overlay error">
            <AlertCircle size={48} style={{ marginBottom: '0.5rem' }} />
            <h3>Playback Failed</h3>
            <p>All servers are blocked or unavailable.</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Try disabling ad blockers, VPNs, or browser extensions.
            </p>
            {lastError && (
              <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.4rem' }}>
                Last: {lastError}
              </p>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRetry}
              style={{ marginTop: '1rem' }}
            >
              <Zap size={16} /> Try Again
            </button>
          </div>
        )}

        {/* Iframe */}
        {!hasError && currentSource && (
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
              zIndex: 5
            }}
          />
        )}

        {/* Playing badge */}
        {isPlaying && !isLoading && (
          <div className="video-player-badge">
            <span className="pulse"></span>
            Playing
          </div>
        )}
      </div>

      {/* Debug info */}
      {debug && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
          <p style={{ margin: '0.2rem 0' }}>Idx: {currentSourceIndex} | Attempted: {attemptedSources.length} | Exhausted: {sourceExhausted ? 'Yes' : 'No'}</p>
          <p style={{ margin: '0.2rem 0' }}>Status: {isPlaying ? '✅ Playing' : isLoading ? '⏳ Loading' : hasError ? '❌ Error' : '⚪ Idle'}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
