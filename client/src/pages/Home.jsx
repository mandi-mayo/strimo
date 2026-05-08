import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import api, { API_BASE_URL as API } from '../api';
import ImageWithFallback from '../components/ImageWithFallback.jsx';

export default function Home() {
  const location = useLocation();
  const [trending, setTrending] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [watchHistory, setWatchHistory] = useState([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'center',
    containScroll: false,
    dragFree: true,
    duration: 25
  });

  const hasCentered = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || trending.length === 0 || hasCentered.current) return;
    const middleIndex = Math.floor(trending.length / 2);
    emblaApi.scrollTo(middleIndex, true);
    hasCentered.current = true;
  }, [emblaApi, trending.length]);

  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const historyRef = useRef(null);
  const moviesRef = useRef(null);
  const tvRef = useRef(null);
  const animeRef = useRef(null);
  const upcomingRef = useRef(null);

  // Scroll to section based on route
  useEffect(() => {
    const sectionMap = {
      '/discover/movie': moviesRef,
      '/discover/tv': tvRef,
      '/discover/anime': animeRef,
      '/upcoming': upcomingRef,
      '/history': historyRef
    };

    const targetRef = sectionMap[location.pathname];
    if (targetRef?.current) {
      setTimeout(() => {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.pathname, loadingPopular, loadingTrending]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('strimo_watch_history');
      if (storedHistory) {
        let history = JSON.parse(storedHistory);
        const uniqueHistory = [];
        const seenTitles = new Set();
        history.forEach(item => {
          if (!seenTitles.has(item.title)) {
            uniqueHistory.push(item);
            seenTitles.add(item.title);
          }
        });
        setWatchHistory(uniqueHistory);
      }
    } catch (e) {
      console.error("Failed to load watch history", e);
    }

    setLoadingTrending(true);
    setLoadingPopular(true);

    Promise.all([
      api.get(`trending`),
      api.get(`popular/movies`),
      api.get(`popular/tv`),
      api.get(`anime/popular`),
      api.get(`upcoming`)
    ]).then(([trendingRes, moviesRes, tvRes, animeRes, upcomingRes]) => {
      setTrending(trendingRes.data || []);
      setPopularMovies(moviesRes.data || []);
      setPopularTV(tvRes.data || []);
      setPopularAnime(animeRes.data || []);
      setUpcoming(upcomingRes.data || []);
    }).catch(err => {
      console.error('Data fetch error:', err.message);
    }).finally(() => {
      setLoadingTrending(false);
      setLoadingPopular(false);
    });
  }, []);

  const buildLink = (item) => {
    if (item.type === 'anime') {
      return `/details/anime-${item.mal_id}?type=anime&mal=${item.mal_id}`;
    }
    return `/details/${item.id}?type=${item.type}${item.imdb_id ? '&imdb=' + item.imdb_id : ''}&source=${item.source || 'tmdb'}`;
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.offsetWidth * 0.8 : ref.current.offsetWidth * 0.8;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 py-6 px-4 sm:px-8 lg:px-16 flex flex-col gap-8 sm:gap-12 overflow-y-auto hide-scrollbar">
      {/* Featured OTT Carousel */}
      {loadingTrending ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="spinner" />
        </div>
      ) : trending.length > 0 ? (
        <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden py-6 sm:py-10 px-0 sm:px-10">
          <div ref={emblaRef}>
            <div className="flex touch-pan-y items-center h-[320px] sm:h-[450px]">
              {trending.map((item, idx) => {
                const diff = Math.abs(idx - selectedIndex);
                const isCenter = diff === 0;
                const scale = isCenter ? 1 : diff === 1 ? 0.85 : diff === 2 ? 0.7 : 0.55;
                const zIndex = 50 - diff * 10;
                
                return (
                  <div 
                    key={`${item.id}-${idx}`} 
                    className="flex-[0_0_auto] w-[220px] sm:w-[320px] transition-all duration-800 ease-out cursor-pointer -mx-12 sm:-mx-16"
                    style={{ 
                      transform: `scale(${scale})`,
                      zIndex: zIndex,
                    }}
                    onMouseEnter={() => {
                      if (!isCenter && emblaApi) {
                        emblaApi.scrollTo(idx);
                      }
                    }}
                    onClick={(e) => {
                      if (!isCenter && emblaApi) {
                        e.preventDefault();
                        emblaApi.scrollTo(idx);
                      }
                    }}
                  >
                    <Link 
                      to={buildLink(item)} 
                      className="block relative w-full aspect-[2/3] rounded-3xl overflow-hidden bg-[#1a1515]/40 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/5 group"
                    >
                      <ImageWithFallback
                        src={item.image || item.backdrop}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 pb-5">
                        <h3 className="text-white font-semibold text-lg sm:text-xl text-center leading-tight truncate w-full drop-shadow-md transition-colors group-hover:text-[#850203]">
                          {item.title}
                        </h3>
                        <p className="text-white/60 text-xs sm:text-sm text-center mt-1 font-medium tracking-wide uppercase">
                          {item.year ? `${item.type === 'series' ? 'TV Series' : item.type} • ${item.year}` : (item.type === 'series' ? 'TV Series' : item.type)}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all z-[60] group/btn shadow-2xl"
          >
            <ChevronLeft size={24} className="group-hover/btn:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all z-[60] group/btn shadow-2xl"
          >
            <ChevronRight size={24} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      ) : null}

      {/* Continue Watching */}
      {watchHistory.length > 0 && (
        <div ref={historyRef} className="flex flex-col gap-4 group/section relative scroll-mt-20">
          <h3 className="text-2xl sm:text-[28px] text-white tracking-wide flex items-center gap-2 font-medium">
            Continue Watching
          </h3>
          <div className="relative">
            <div 
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {watchHistory.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  to={item.link}
                  className="flex-none w-[220px] sm:w-[260px] bg-[#1a1515]/40 backdrop-blur-md rounded-[25px] overflow-hidden snap-start relative group border border-white/5"
                >
                  <div className="h-[140px] sm:h-[150px] relative">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" size={40} />
                    </div>
                  </div>
                  <div className="p-4 bg-[#1a1515]">
                    <p className="text-white font-semibold text-sm leading-tight truncate">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            
            <button 
              onClick={() => scroll(historyRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={() => scroll(historyRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Popular Movies */}
      {!loadingPopular && popularMovies.length > 0 && (
        <div ref={moviesRef} className="flex flex-col gap-6 group/section relative scroll-mt-20">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-[28px] text-white tracking-wide font-medium">Popular Movies</h3>
            <Link to="/discover/movie" className="text-[11px] text-[#850203] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors">View All</Link>
          </div>
          <div className="relative">
            <div 
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {popularMovies.map((item) => (
                <Link
                  key={item.id}
                  to={buildLink(item)}
                  className="flex-none w-[180px] sm:w-[220px] aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-[30px] overflow-hidden snap-start relative group border border-white/5"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-5">
                    <p className="text-white font-semibold text-sm leading-tight truncate mb-1">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5">
                        <Star size={10} fill="#f5c518" stroke="#f5c518" />
                        {item.rating}
                      </span>
                      <span className="text-white/40 text-[10px]">{item.year}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="text-white fill-white" size={40} />
                  </div>
                </Link>
              ))}
            </div>
            <button 
              onClick={() => scroll(moviesRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={() => scroll(moviesRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Popular TV Series */}
      {!loadingPopular && popularTV.length > 0 && (
        <div ref={tvRef} className="flex flex-col gap-6 group/section relative scroll-mt-20">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-[28px] text-white tracking-wide font-medium">Popular TV Series</h3>
            <Link to="/discover/tv" className="text-[11px] text-[#850203] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors">View All</Link>
          </div>
          <div className="relative">
            <div 
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {popularTV.map((item) => (
                <Link
                  key={item.id}
                  to={buildLink(item)}
                  className="flex-none w-[180px] sm:w-[220px] aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-[30px] overflow-hidden snap-start relative group border border-white/5"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-5">
                    <p className="text-white font-semibold text-sm leading-tight truncate mb-1">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5">
                        <Star size={10} fill="#f5c518" stroke="#f5c518" />
                        {item.rating}
                      </span>
                      <span className="text-white/40 text-[10px]">{item.year}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="text-white fill-white" size={40} />
                  </div>
                </Link>
              ))}
            </div>
            <button 
              onClick={() => scroll(tvRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={() => scroll(tvRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Top Anime Section */}
      {!loadingPopular && popularAnime.length > 0 && (
        <div ref={animeRef} className="flex flex-col gap-6 group/section relative scroll-mt-20">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-[28px] text-white tracking-wide flex items-center gap-3 font-medium">
              Top Anime
            </h3>
            <Link to="/discover/anime" className="text-[11px] text-[#850203] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors">View All</Link>
          </div>
          <div className="relative">
            <div 
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {popularAnime.map((item) => (
                <Link
                  key={item.id}
                  to={buildLink(item)}
                  className="flex-none w-[180px] sm:w-[220px] aspect-[2/3] bg-[#1a1515]/40 backdrop-blur-md rounded-[30px] overflow-hidden snap-start relative group border border-white/5"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-5">
                    <p className="text-white font-semibold text-sm leading-tight truncate mb-1">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5">
                        <Star size={10} fill="#f5c518" stroke="#f5c518" />
                        {item.rating}
                      </span>
                      <span className="text-white/40 text-[10px]">{item.year}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="text-white fill-white" size={40} />
                  </div>
                </Link>
              ))}
            </div>
            <button 
              onClick={() => scroll(animeRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={() => scroll(animeRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Movies */}
      {!loadingPopular && upcoming.length > 0 && (
        <div ref={upcomingRef} className="flex flex-col gap-6 group/section relative scroll-mt-20">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-[28px] text-white tracking-wide font-medium">Coming Soon</h3>
            <span className="text-[10px] bg-[#850203]/20 text-[#850203] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Upcoming</span>
          </div>
          <div className="relative">
            <div 
              className="flex gap-5 overflow-x-auto pb-10 snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {upcoming.map((item) => (
                <Link
                  key={item.id}
                  to={buildLink(item)}
                  className="flex-none w-[200px] sm:w-[240px] aspect-video bg-[#1a1515] rounded-[20px] overflow-hidden snap-start relative group border border-white/5"
                >
                  <ImageWithFallback
                    src={item.backdrop || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
                    <p className="text-white font-semibold text-xs leading-tight truncate">{item.title}</p>
                    <p className="text-white/40 text-[10px] mt-1">{item.year}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button 
              onClick={() => scroll(upcomingRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={() => scroll(upcomingRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/5 mt-auto">
        <p>Strimo — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
}
