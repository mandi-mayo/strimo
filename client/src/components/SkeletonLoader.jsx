import React from 'react';

const SkeletonLoader = ({ type = 'row', count = 6 }) => {
  if (type === 'hero') {
    return <div className="skeleton skeleton-hero" />;
  }

  if (type === 'grid') {
    return (
      <div className="media-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-poster" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text-sm" />
          </div>
        ))}
      </div>
    );
  }

  // Default: row
  return (
    <div className="media-row" style={{ paddingBottom: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-poster" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text-sm" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
