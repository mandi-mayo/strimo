import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

const MediaCard = ({ item, showType = false }) => {
  const linkTo = item.type === 'anime'
    ? `/details/anime-${item.mal_id}?type=anime&mal=${item.mal_id}`
    : `/details/${item.id}?type=${item.type}${item.imdb_id ? '&imdb=' + item.imdb_id : ''}&source=${item.source || 'tmdb'}`;

  return (
    <Link to={linkTo} className="media-card" title={item.title}>
      {item.type === 'anime' && <span className="media-card-badge">Anime</span>}
      <div className="media-poster-container">
        <img
          src={item.image || ''}
          alt={item.title}
          className="media-poster"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="media-overlay">
          <button className="media-play-icon" aria-label="Play">
            <Play fill="white" size={20} />
          </button>
        </div>
      </div>
      <div className="media-info">
        <h3 className="media-title">{item.title}</h3>
        <div className="media-meta">
          <span>{item.year || 'N/A'}</span>
          {item.rating && (
            <span className="rating">
              <Star size={11} fill="#f5c518" stroke="#f5c518" />
              {item.rating}
            </span>
          )}
          {showType && (
            <span className="media-type-badge">
              {item.type === 'series' ? 'TV' : item.type?.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
