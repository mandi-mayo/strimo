import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import SkeletonLoader from './SkeletonLoader';

const MediaRow = ({ title, items = [], loading = false, gradient = '', showType = false, icon = null }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.offsetWidth * 0.7;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">
          {icon}
          <span className={gradient || ''}>{title}</span>
        </h2>
      </div>

      <div className="media-row-container">
        <button className="media-row-arrow left" onClick={() => scroll('left')} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>

        {loading ? (
          <SkeletonLoader type="row" count={8} />
        ) : (
          <div className="media-row" ref={rowRef}>
            {items.filter(item => item.image).map((item, index) => (
              <MediaCard key={`${item.id}-${index}`} item={item} showType={showType} />
            ))}
          </div>
        )}

        <button className="media-row-arrow right" onClick={() => scroll('right')} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MediaRow;
