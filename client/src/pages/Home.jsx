import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Clock, TrendingUp, Film, Tv, Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import api, { API_BASE_URL as API } from '../api';
import ImageWithFallback from '../components/ImageWithFallback.jsx';

/* ─── Horizontal Scroll Row Component ─────────────────────────── */
function ScrollRow({ children, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="relative group/row">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 z-20 flex items-center justify-start pl-1 bg-gradient-to-r from-[#111010] via-[#111010]/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft size={16} className="text-white" />
          </div>
        </button>
      )}
      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 z-20 flex items-center justify-end pr-1 bg-gradient-to-l from-[#111010] via-[#111010]/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight size={16} className="text-white" />
          </div>
        </button>
      )}
      <div
        ref={scrollRef}
        className={`flex gap-3 overflow-x-auto pb-2 hide-scrollbar scroll-smooth ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Card Component for Movie/TV Items ───────────────────────── */
function MediaCard({ item, buildLink, size = 'default' }) {
  const widthClass = size === 'small' ? 'w-[150px] sm:w-[165px]' : 'w-[160px] sm:w-[175px]';
  
  return (
    <Link
      to={buildLink(item)}
      className={`flex-none ${widthClass} aspect-[2/3] bg-[#1a1717] rounded-2xl overflow-hidden relative group border border-white/[0.04] hover:border-white/10 transition-all duration-500 hover:shadow-xl hover:shadow-black/30`}
    >
      <ImageWithFallback
        src={item.image}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 flex flex-col justify-end p-3.5">
        <p className="text-white font-semibold text-[13px] leading-tight truncate mb-1">{item.title}</p>
        <div className="flex items-center gap-2">
          {item.rating && (
            <span className="text-amber-400 text-[10px] flex items-center gap-0.5 font-medium">
              <Star size={9} fill="currentColor" stroke="currentColor" />
              {item.rating}
            </span>
          )}
          <span className="text-white/35 text-[10px]">{item.year}</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-[#dc2626]/90 flex items-center justify-center shadow-lg shadow-red-900/40 scale-75 group-hover:scale-100 transition-transform duration-500">
          <Play className="text-white fill-white ml-0.5" size={18} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Section Header ──────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, badge, link, linkText = 'See All' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={18} className="text-[#dc2626]" strokeWidth={2} />}
        <h3 className="text-[17px] sm:text-lg text-white font-semibold tracking-tight">{title}</h3>
        {badge && (
          <span className="text-[9px] bg-[#dc2626]/15 text-[#dc2626] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      {link && (
        <Link to={link} className="text-[11px] text-white/30 font-medium hover:text-[#dc2626] transition-colors uppercase tracking-wider">
          {linkText}
        </Link>
      )}
    </div>
  );
}

/* ─── Main Home Page ──────────────────────────────────────────── */
export default function Home() {
  const [trending, setTrending] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [watchHistory, setWatchHistory] = useState([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'center',
    containScroll: false,
    dragFree: false
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

  // Instantly jump to the center card on initial load
  useEffect(() => {
    if (!emblaApi || trending.length === 0 || hasCentered.current) return;
    const middleIndex = Math.floor(trending.length / 2);
    emblaApi.scrollTo(middleIndex, true);
    hasCentered.current = true;
  }, [emblaApi, trending.length]);

  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    // Load watch history from local storage
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
      api.get(`trending`).catch(() => ({ data: [] })),
      api.get(`popular/movies`).catch(() => ({ data: [] })),
      api.get(`popular/tv`).catch(() => ({ data: [] })),
      api.get(`upcoming`).catch(() => ({ data: [] })),
      api.get(`top-rated/movie`).catch(() => ({ data: [] })),
      api.get(`anime/trending`).catch(() => ({ data: [] })),
    ]).then(([trendingRes, moviesRes, tvRes, upcomingRes, topRatedRes, animeRes]) => {
      setTrending(trendingRes.data || []);
      setPopularMovies(moviesRes.data || []);
      setPopularTV(tvRes.data || []);
      setUpcoming(upcomingRes.data || []);
      setTopRatedMovies(topRatedRes.data || []);
      setTrendingAnime(animeRes.data || []);
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

  return (
    <div className="flex-1 py-5 px-5 lg:px-8 flex flex-col gap-6 overflow-y-auto">
      
      {/* ─── Featured Carousel (kept as-is) ──────────────────────── */}
      {loadingTrending ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="spinner" />
        </div>
      ) : trending.length > 0 ? (
        <div id="section-home" className="relative w-full max-w-[1200px] mx-auto overflow-hidden py-6 px-2 sm:px-6">
          <div ref={emblaRef}>
            <div className="flex touch-pan-y items-center h-[300px] sm:h-[380px]">
              {trending.map((item, idx) => {
                const diff = Math.abs(idx - selectedIndex);
                const isCenter = diff === 0;
                const scale = isCenter ? 1 : diff === 1 ? 0.85 : diff === 2 ? 0.7 : 0.55;
                const zIndex = 50 - diff * 10;
                
                return (
                  <div 
                    key={`${item.id}-${idx}`} 
                    className="flex-[0_0_auto] w-[220px] sm:w-[280px] transition-all duration-800 ease-out cursor-pointer -mx-8 sm:-mx-14"
                    style={{ 
                      transform: `scale(${scale})`,
                      zIndex: zIndex,
                    }}
                    onMouseEnter={() => {
                      if (!isCenter && emblaApi) emblaApi.scrollTo(idx);
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
                      className="block relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1717] shadow-[0_12px_35px_rgba(0,0,0,0.6)] border border-white/[0.04] group"
                    >
                      <ImageWithFallback
                        src={item.image || item.backdrop}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-5 pb-4">
                        <h3 className="text-white font-semibold text-base sm:text-lg text-center leading-tight truncate w-full drop-shadow-md transition-colors group-hover:text-[#dc2626]">
                          {item.title}
                        </h3>
                        <p className="text-white/50 text-[11px] text-center mt-0.5 font-medium tracking-wide uppercase">
                          {item.year ? `${item.type === 'series' ? 'TV Series' : item.type} • ${item.year}` : (item.type === 'series' ? 'TV Series' : item.type)}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-[60] cursor-pointer"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-[60] cursor-pointer"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      ) : null}

      {/* ─── Continue Watching ────────────────────────────────────── */}
      {watchHistory.length > 0 && (
        <section id="section-history">
          <SectionHeader icon={Clock} title="Continue Watching" />
          <ScrollRow>
            {watchHistory.map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                to={item.link}
                className="flex-none w-[200px] sm:w-[230px] bg-[#1a1717] rounded-2xl overflow-hidden relative group border border-white/[0.04] hover:border-white/10 transition-all duration-400"
              >
                <div className="h-[120px] sm:h-[130px] relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#dc2626]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                      <Play className="text-white fill-white ml-0.5" size={16} />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-[#1a1717]">
                  <p className="text-white font-semibold text-xs leading-tight truncate">{item.title}</p>
                </div>
              </Link>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Popular Movies ───────────────────────────────────────── */}
      {!loadingPopular && popularMovies.length > 0 && (
        <section id="section-movies">
          <SectionHeader icon={Film} title="Popular Movies" link="/discover/movie" />
          <ScrollRow>
            {popularMovies.map((item) => (
              <MediaCard key={item.id} item={item} buildLink={buildLink} />
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Popular TV Series ────────────────────────────────────── */}
      {!loadingPopular && popularTV.length > 0 && (
        <section id="section-tv">
          <SectionHeader icon={Tv} title="Popular TV Series" link="/discover/tv" />
          <ScrollRow>
            {popularTV.map((item) => (
              <MediaCard key={item.id} item={item} buildLink={buildLink} />
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Top Rated ────────────────────────────────────────────── */}
      {!loadingPopular && topRatedMovies.length > 0 && (
        <section id="section-top-rated">
          <SectionHeader icon={TrendingUp} title="Top Rated" badge="IMDb" />
          <ScrollRow>
            {topRatedMovies.map((item) => (
              <MediaCard key={item.id} item={item} buildLink={buildLink} size="small" />
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Trending Anime ───────────────────────────────────────── */}
      {!loadingPopular && trendingAnime.length > 0 && (
        <section id="section-anime">
          <SectionHeader icon={Sparkles} title="Trending Anime" />
          <ScrollRow>
            {trendingAnime.map((item) => (
              <MediaCard key={item.id} item={item} buildLink={buildLink} />
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Coming Soon ──────────────────────────────────────────── */}
      {!loadingPopular && upcoming.length > 0 && (
        <section id="section-upcoming">
          <SectionHeader title="Coming Soon" badge="Upcoming" />
          <ScrollRow>
            {upcoming.map((item) => (
              <Link
                key={item.id}
                to={buildLink(item)}
                className="flex-none w-[200px] sm:w-[240px] aspect-video bg-[#1a1717] rounded-2xl overflow-hidden relative group border border-white/[0.04] hover:border-white/10 transition-all duration-500"
              >
                <ImageWithFallback
                  src={item.backdrop || item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <p className="text-white font-semibold text-xs leading-tight truncate">{item.title}</p>
                  <p className="text-white/35 text-[10px] mt-0.5">{item.year}</p>
                </div>
              </Link>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-white/20 text-xs border-t border-white/[0.04] mt-auto">
        <p>Strimo — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
}
