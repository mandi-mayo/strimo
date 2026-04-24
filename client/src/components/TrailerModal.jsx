import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url) return null;

  try {
    // Handle youtube.com/watch?v=xxxxx, youtu.be/xxxxx, youtube.com/embed/xxxxx
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (watchMatch && watchMatch[1]) {
      console.log('✅ YouTube ID extracted:', watchMatch[1]);
      return watchMatch[1];
    }
    console.warn('⚠️ Could not extract YouTube ID from URL:', url);
  } catch (e) {
    console.error('❌ Error extracting YouTube ID:', e);
  }

  return null;
};

const TrailerModal = ({ isOpen, onClose, trailerUrl, title }) => {
  const [error, setError] = useState(false);

  const videoId = extractYouTubeId(trailerUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : null;

  const handleIframeError = () => {
    console.error('❌ Trailer failed to load');
    setError(true);
  };

  const handleIframeLoad = () => {
    console.log('✅ Trailer iframe loaded successfully');
    setError(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-container">
        <div className="modal-content">
          {/* Close Button */}
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close trailer"
          >
            <X size={24} />
          </button>

          {/* Trailer Title */}
          <h3 className="modal-title">{title} - Trailer</h3>

          {/* Video Container */}
          {embedUrl && !error ? (
            <div className="trailer-container">
              <iframe
                src={embedUrl}
                title={`${title} Trailer`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0.5rem' }}
              />
            </div>
          ) : (
            <div className="trailer-error">
              {error ? (
                <>
                  <AlertCircle size={48} style={{ marginBottom: '0.5rem' }} />
                  <p>Failed to load trailer</p>
                </>
              ) : (
                <>
                  <AlertCircle size={48} style={{ marginBottom: '0.5rem' }} />
                  <p>Trailer not available</p>
                </>
              )}
              {trailerUrl && !embedUrl && (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem' }}
                >
                  Watch on YouTube
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrailerModal;
