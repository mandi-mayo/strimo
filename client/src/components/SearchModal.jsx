import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Play, Star, X } from 'lucide-react';
import api, { API_BASE_URL as API } from '../api';
import ImageWithFallback from './ImageWithFallback.jsx';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [animeResults, setAnimeResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Debounce hook
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Clear search when closed
      setQuery('');
      setResults([]);
      setAnimeResults([]);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setAnimeResults([]);
      return;
    }

    setIsLoading(true);

    Promise.all([
      api.get(`search?q=${encodeURIComponent(debouncedQuery)}`).catch(() => ({ data: [] })),
      api.get(`anime/search?q=${encodeURIComponent(debouncedQuery)}`).catch(() => ({ data: [] })),
    ]).then(([mainRes, animeRes]) => {
      setResults(mainRes.data || []);
      setAnimeResults(animeRes.data || []);
    }).finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const buildLink = (item) => {
    if (item.type === 'anime') {
      return `/details/anime-${item.mal_id}?type=anime&mal=${item.mal_id}`;
    }
    return `/details/${item.id}?type=${item.type}${item.imdb_id ? '&imdb=' + item.imdb_id : ''}&source=${item.source || 'tmdb'}`;
  };

  const handleResultClick = (item) => {
    onClose();
    navigate(buildLink(item));
  };

  const allResults = [...results, ...animeResults];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center pt-20 px-4 bg-[#1a1515]/80 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Background click area to close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-colors z-10"
      >
        <X size={28} />
      </button>

      {/* Search Bar Container */}
      <div className="w-full max-w-4xl relative z-10 animate-in slide-in-from-top-10 duration-300">
        <div className="bg-[#292323]/60 backdrop-blur-xl border border-white/10 h-[70px] rounded-[35px] flex items-center px-8 relative overflow-hidden focus-within:ring-2 ring-[#850203]/50 transition-all shadow-2xl">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, anime..."
            className="w-full bg-transparent border-none outline-none text-white text-xl placeholder:text-white/30"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="text-white/30 hover:text-white mr-4 transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <SearchIcon className="text-[#850203] shrink-0" size={28} strokeWidth={2} />
        </div>
      </div>

      {/* Results Area */}
      <div className="w-full max-w-6xl mt-8 flex-1 overflow-y-auto z-10 pb-20 hide-scrollbar px-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="spinner" />
          </div>
        ) : allResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-8 animate-in fade-in duration-300">
            {allResults.filter(i => i.image).map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                onClick={() => handleResultClick(item)}
                className="aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-[2rem] overflow-hidden relative group cursor-pointer border border-white/5 transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-5">
                   <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                      <p className="text-white font-bold text-sm leading-tight mb-2 group-hover:text-[#ff1a1c] line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-3">
                        {item.rating && (
                          <span className="text-[#f5c518] text-xs flex items-center gap-1 font-bold">
                            <Star size={12} fill="#f5c518" stroke="#f5c518" />
                            {item.rating}
                          </span>
                        )}
                        <span className="text-white/40 text-[10px] font-bold tracking-wider">{item.year}</span>
                      </div>
                   </div>
                </div>

                {/* Play Button Icon on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-50 group-hover:scale-100 pointer-events-none">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                    <Play className="text-white fill-white ml-1 drop-shadow-md" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <h3 className="text-xl mb-2 text-white/60">No results found</h3>
            <p>We couldn't find anything for "{query}".</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
