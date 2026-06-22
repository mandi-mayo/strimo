import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Play, Star, X, ArrowLeft, Film, Tv, Sparkles } from 'lucide-react';
import api, { API_BASE_URL as API } from '../api';
import ImageWithFallback from './ImageWithFallback.jsx';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [animeResults, setAnimeResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Debounce hook
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Load suggestions when opened
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      setLoadingSuggestions(true);
      api.get('trending')
        .then(res => {
          setSuggestions(res.data || []);
        })
        .catch(err => {
          console.error("Failed to load search suggestions", err);
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }
  }, [isOpen, suggestions.length]);

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

  const getTypeIcon = (type) => {
    if (type === 'anime') return <Sparkles size={10} />;
    if (type === 'series') return <Tv size={10} />;
    return <Film size={10} />;
  };

  const getTypeLabel = (type) => {
    if (type === 'anime') return 'Anime';
    if (type === 'series') return 'TV';
    return 'Movie';
  };

  // ═══════════════════════════════════════════════════════════════════
  // MOBILE SEARCH LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  const renderMobileSearch = () => (
    <div className="fixed inset-0 z-[200] bg-[#0a0808] flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors shrink-0"
        >
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div className="flex-1 flex items-center bg-[#1a1515] border border-white/8 rounded-full px-4 h-10 focus-within:border-[#850203]/40 transition-colors">
          <SearchIcon size={15} className="text-white/30 shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] placeholder:text-white/25"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/25 active:text-white/60 ml-2 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" style={{ width: '28px', height: '28px', borderWidth: '2px' }} />
          </div>
        ) : allResults.length > 0 ? (
          <div className="flex flex-col gap-2.5 pt-2">
            {allResults.filter(i => i.image).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => handleResultClick(item)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] active:bg-white/[0.07] transition-colors cursor-pointer"
              >
                {/* Poster Thumbnail */}
                <div className="w-[52px] h-[72px] rounded-sm overflow-hidden bg-[#1a1515] shrink-0">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-semibold leading-tight truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#850203] uppercase tracking-wider bg-[#850203]/10 px-1.5 py-0.5 rounded">
                      {getTypeIcon(item.type)}
                      {getTypeLabel(item.type)}
                    </span>
                    {item.year && (
                      <span className="text-white/35 text-[10px]">{item.year}</span>
                    )}
                    {item.rating && (
                      <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5 font-medium">
                        <Star size={8} fill="#f5c518" stroke="#f5c518" />
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Play hint */}
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <Play size={11} className="text-white/40 fill-white/40 ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        ) : query && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon size={32} className="text-white/10 mb-3" />
            <p className="text-white/40 text-[13px] font-medium">No results for "{query}"</p>
            <p className="text-white/20 text-[11px] mt-1">Try a different spelling or keyword</p>
          </div>
        ) : !query ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2 px-1 text-white/50 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={12} className="text-[#850203]" />
              <span>Suggested for You</span>
            </div>
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-10">
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {suggestions.slice(0, 10).filter(i => i.image).map((item, idx) => (
                  <div
                    key={`suggest-mobile-${item.id}-${idx}`}
                    onClick={() => handleResultClick(item)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] active:bg-white/[0.07] transition-colors cursor-pointer"
                  >
                    {/* Poster Thumbnail */}
                    <div className="w-[52px] h-[72px] rounded-sm overflow-hidden bg-[#1a1515] shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-semibold leading-tight truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-[#850203] uppercase tracking-wider bg-[#850203]/10 px-1.5 py-0.5 rounded">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </span>
                        {item.year && (
                          <span className="text-white/35 text-[10px]">{item.year}</span>
                        )}
                        {item.rating && (
                          <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5 font-medium">
                            <Star size={8} fill="#f5c518" stroke="#f5c518" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play hint */}
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <Play size={11} className="text-white/40 fill-white/40 ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // DESKTOP SEARCH LAYOUT (existing)
  // ═══════════════════════════════════════════════════════════════════
  const renderDesktopSearch = () => (
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
                className="aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-lg overflow-hidden relative group cursor-pointer border border-white/5 transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1"
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
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-wider">
              <Sparkles size={16} className="text-[#850203]" />
              <span>Suggested Movies & TV Shows</span>
            </div>
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-8">
                {suggestions.filter(i => i.image).map((item, idx) => (
                  <div 
                    key={`suggest-desktop-${item.id}-${idx}`}
                    onClick={() => handleResultClick(item)}
                    className="aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-lg overflow-hidden relative group cursor-pointer border border-white/5 transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1"
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
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: minimal full-screen search */}
      <div className="block lg:hidden">
        {renderMobileSearch()}
      </div>

      {/* Desktop: existing modal overlay */}
      <div className="hidden lg:block">
        {renderDesktopSearch()}
      </div>
    </>
  );
}
