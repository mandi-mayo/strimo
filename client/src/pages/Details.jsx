import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api, { API_BASE_URL as API } from '../api';
import { Play, Star, Clock, Calendar, Award, ChevronDown } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';

export default function Details() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const imdbParam = searchParams.get('imdb');
  const malParam = searchParams.get('mal');
  const source = searchParams.get('source') || 'tmdb';

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const [episodePage, setEpisodePage] = useState(0);
  const [jumpEpisode, setJumpEpisode] = useState('');

  // Fetch details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        let data;
        if (type === 'anime' && malParam) {
          const res = await api.get(`anime/details/${malParam}`);
          data = res.data;
        } else {
          const url = `details/${id}?type=${type}${imdbParam ? '&imdb=' + imdbParam : ''}&source=${source}`;
          const res = await api.get(url);
          data = res.data;
        }
        setDetails(data);

        if (data.seasons && data.seasons.length > 0) {
          setCurrentSeason(data.seasons[0].season_number);
        } else if (data.episodes && data.episodes.length > 0) {
          setCurrentSeason(data.episodes[0].season || 1);
          setCurrentEpisode(data.episodes[0].number || 1);
          setEpisodes(data.episodes);
        }
      } catch (error) {
        console.error('Failed to fetch details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
    window.scrollTo(0, 0);
  }, [id, type, imdbParam, malParam, source]);

  // Fetch episodes for selected season (TMDB)
  useEffect(() => {
    if (!details || type === 'anime' || !details.seasons || details.source !== 'tmdb') return;
    setEpisodesLoading(true);
    api.get(`season/${details.tmdb_id || details.id}/${currentSeason}`)
      .then(r => {
        setEpisodes(r.data);
        if (r.data.length > 0) {
          setCurrentEpisode(r.data[0].number);
        }
      })
      .catch(() => setEpisodes([]))
      .finally(() => setEpisodesLoading(false));
  }, [currentSeason, details]);

  // Auto-update episode page
  useEffect(() => {
    const newPage = Math.floor((currentEpisode - 1) / 100);
    if (newPage >= 0 && newPage !== episodePage) {
      setEpisodePage(newPage);
    }
  }, [currentEpisode]);

  // Save to Watch History
  useEffect(() => {
    if (!details) return;

    try {
      const historyStr = localStorage.getItem('strimo_watch_history');
      let history = historyStr ? JSON.parse(historyStr) : [];
      
      const newItemId = String(details.id || details.mal_id);
      const newItem = {
        id: newItemId,
        title: details.title,
        image: details.backdrop || details.image,
        type: type,
        link: `/details/${id}?type=${type}${imdbParam ? '&imdb=' + imdbParam : ''}${malParam ? '&mal=' + malParam : ''}&source=${source}`,
        progress: Math.floor(Math.random() * 60) + 10 // Fake progress between 10% and 70% for UI
      };

      // Remove existing entry for the same media (check both ID and title to be safe)
      history = history.filter(item => item.id !== newItemId && item.title !== details.title);
      
      // Add to beginning
      history.unshift(newItem);
      
      // Keep only last 15
      history = history.slice(0, 15);
      
      localStorage.setItem('strimo_watch_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save watch history", e);
    }
  }, [details, id, type, imdbParam, malParam, source, currentEpisode, currentSeason]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/50 text-xl">
        Failed to load content details.
      </div>
    );
  }

  // Video sources (from old backend integration)
  const getSources = () => {
    const isTmdb = details.source === 'tmdb';
    const tmdbId = isTmdb ? (details.tmdb_id || details.id) : details.tmdb_id;
    const imdbId = details.imdb_id;
    const malId = details.mal_id;
    const mediaId = tmdbId || imdbId || malId;

    if (!mediaId) return [];

    const sources = [];

    if (type === 'anime') {
      if (malId) {
        sources.push({ name: '🎬 VidLink PRO', url: `https://vidlink.pro/anime/${malId}/${currentEpisode}`, priority: 1 });
        sources.push({ name: '📺 VidSrc PM', url: `https://vidsrc.pm/embed/anime/${malId}/${currentEpisode}`, priority: 2 });
      }
    } else if (type === 'series') {
      if (tmdbId) {
        sources.push({ name: '🎬 VidLink PRO', url: `https://vidlink.pro/tv/${tmdbId}/${currentSeason}/${currentEpisode}`, priority: 2 });
      }
      sources.push({
        name: '📺 VidSrc PM',
        url: imdbId
          ? `https://vidsrc.pm/embed/tv?imdb=${imdbId}&season=${currentSeason}&episode=${currentEpisode}`
          : `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`,
        priority: 1
      });
      if (tmdbId) {
        sources.push({ name: '📽️ AutoEmbed', url: `https://autoembed.to/tv/tmdb/${tmdbId}-${currentSeason}-${currentEpisode}`, priority: 3 });
        sources.push({ name: '🎞️ VidSrc XYZ', url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`, priority: 4 });
        sources.push({ name: '🌐 MultiEmbed', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`, priority: 5 });
      }
    } else {
      sources.push({ name: '🎬 VidLink PRO', url: `https://vidlink.pro/movie/${mediaId}`, priority: 2 });
      sources.push({
        name: '📺 VidSrc PM',
        url: imdbId ? `https://vidsrc.pm/embed/movie?imdb=${imdbId}` : `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}`,
        priority: 1
      });
      if (tmdbId) {
        sources.push({ name: '📽️ AutoEmbed', url: `https://autoembed.to/movie/tmdb/${tmdbId}`, priority: 3 });
        sources.push({ name: '🎞️ VidSrc XYZ', url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`, priority: 4 });
        sources.push({ name: '🌐 MultiEmbed', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, priority: 5 });
      }
    }

    return sources.sort((a, b) => a.priority - b.priority);
  };

  const videoSources = getSources();
  const omdb = details.omdbRatings;

  // Anime episodes list
  const getAnimeEpisodesList = () => {
    if (type !== 'anime') return episodes;
    let list = [...episodes];
    let maxEp = details.episodes_count || 0;
    if (!maxEp) {
      maxEp = details.status === 'Currently Airing' ? 1200 : list.length;
    } else {
      maxEp = Math.max(maxEp, list.length);
    }
    const existingEpNumbers = new Set(list.map(e => e.number));
    for (let i = 1; i <= maxEp; i++) {
      if (!existingEpNumbers.has(i)) {
        list.push({ id: `dummy-${i}`, number: i, name: `Episode ${i}` });
      }
    }
    return list.sort((a, b) => a.number - b.number);
  };

  const allAnimeEpisodes = getAnimeEpisodesList();
  const CHUNK_SIZE = 100;
  const currentList = type === 'anime' ? allAnimeEpisodes : episodes;
  const totalEpisodePages = Math.ceil(currentList.length / CHUNK_SIZE);
  const displayEpisodes = currentList.slice(episodePage * CHUNK_SIZE, (episodePage + 1) * CHUNK_SIZE);

  const handleJumpToEpisode = (e) => {
    e.preventDefault();
    const epNum = Number(jumpEpisode);
    if (epNum > 0) {
      setCurrentEpisode(epNum);
      const player = document.getElementById('player');
      if (player) player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const buildLink = (item) => {
    if (item.type === 'anime') {
      return `/details/anime-${item.mal_id}?type=anime&mal=${item.mal_id}`;
    }
    return `/details/${item.id}?type=${item.type}${item.imdb_id ? '&imdb=' + item.imdb_id : ''}&source=${item.source || 'tmdb'}`;
  };

  const renderEpisodes = (list) => {
    return (
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Season Selector */}
            {type === 'series' && details.seasons && details.seasons.length > 0 && (
              <div className="relative group/select">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1515] border border-white/10 rounded-xl text-sm font-semibold text-white/90 hover:border-[#850203]/50 transition-all cursor-pointer">
                  <span>Season {currentSeason}</span>
                  <ChevronDown size={14} className="text-white/40 group-hover/select:text-[#850203] transition-colors" />
                </div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#292323] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/select:opacity-100 group-hover/select:visible transition-all z-[60] py-1.5">
                   <div className="max-h-[300px] overflow-y-auto hide-scrollbar">
                    {details.seasons.map(s => (
                      <button
                        key={s.season_number}
                        onClick={() => setCurrentSeason(s.season_number)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${currentSeason === s.season_number ? 'bg-[#850203] text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        Season {s.season_number}
                      </button>
                    ))}
                   </div>
                </div>
              </div>
            )}

            {/* Episode Selector */}
            {list.length > 0 && (
              <div className="relative group/select">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1515] border border-white/10 rounded-xl text-sm font-semibold text-white/90 hover:border-[#850203]/50 transition-all cursor-pointer">
                  <span>Episode {currentEpisode}</span>
                  <ChevronDown size={14} className="text-white/40 group-hover/select:text-[#850203] transition-colors" />
                </div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#292323] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/select:opacity-100 group-hover/select:visible transition-all z-[60] py-1.5">
                   <div className="max-h-[300px] overflow-y-auto hide-scrollbar">
                    {list.map(ep => (
                      <button
                        key={ep.id || ep.number}
                        onClick={() => {
                          setCurrentEpisode(ep.number);
                          if (type === 'anime') {
                            const newPage = Math.floor((ep.number - 1) / CHUNK_SIZE);
                            if (newPage !== episodePage) setEpisodePage(newPage);
                          }
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${currentEpisode === ep.number ? 'bg-[#850203] text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        Episode {ep.number}
                      </button>
                    ))}
                   </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Anime Pagination */}
          {type === 'anime' && totalEpisodePages > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {Array.from({ length: totalEpisodePages }).map((_, i) => {
                const startEp = i * CHUNK_SIZE + 1;
                const endEp = Math.min((i + 1) * CHUNK_SIZE, list.length);
                return (
                  <button
                    key={i}
                    onClick={() => setEpisodePage(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      episodePage === i ? 'bg-[#850203] text-white' : 'bg-[#1a1515] text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {startEp}-{endEp}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Horizontal Scroller */}
        {episodesLoading ? (
          <div className="flex gap-4 overflow-hidden mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-none w-[260px] h-[150px] bg-[#1a1515] rounded-[15px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 mt-2 snap-x snap-mandatory hide-scrollbar relative scroll-smooth">
            {(type === 'anime' ? displayEpisodes : list).map((ep) => {
              const isActive = ep.number === currentEpisode;
              return (
                <div
                  key={ep.id || ep.number}
                  id={`ep-card-${ep.number}`}
                  className="flex-none w-[180px] sm:w-[220px] snap-start cursor-pointer group"
                  onClick={() => {
                    setCurrentEpisode(ep.number);
                    if (type === 'anime') {
                      const newPage = Math.floor((ep.number - 1) / CHUNK_SIZE);
                      if (newPage !== episodePage) setEpisodePage(newPage);
                    }
                    setTimeout(() => {
                      const player = document.getElementById('player');
                      if (player) player.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                >
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
                    {ep.image ? (
                      <ImageWithFallback src={ep.image} alt={ep.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-[#1a1515] flex items-center justify-center">
                        <AlertCircle size={24} className="text-white/10" />
                      </div>
                    )}
                    
                    {/* Active/Hover Border Overlay */}
                    <div className={`absolute inset-0 transition-all duration-300 pointer-events-none rounded-xl ${
                      isActive 
                        ? 'border-[2.5px] border-[#850203] shadow-[inset_0_0_15px_rgba(133,2,3,0.4)]' 
                        : 'border border-white/5 group-hover:border-white/20'
                    }`} />
                    
                    {/* Play Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <Play className="text-white fill-white drop-shadow-lg" size={32} />
                    </div>
                    
                    {ep.filler && (
                      <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500/90 text-white backdrop-blur-sm shadow-md font-bold tracking-wider">
                        FILLER
                      </span>
                    )}
                  </div>
                  
                  <div className="px-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-sm ${isActive ? 'text-[#850203]' : 'text-white/70'}`}>
                        {ep.number}.
                      </span>
                      <h4 className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-white/90'}`} title={ep.name}>
                        {ep.name || `Episode ${ep.number}`}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 font-medium">
                      {ep.runtime && <span>{ep.runtime}m</span>}
                      {ep.rating ? <span>★ {Math.round(ep.rating * 10) / 10}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 py-8 px-8 lg:px-16 flex flex-col gap-10 overflow-y-auto">
      {/* Top Banner / Movie Info - Dark Poster Background */}
      <div className="relative w-full bg-[#1a1515] rounded-[30px] min-h-[450px] overflow-hidden flex flex-col lg:flex-row text-white shadow-2xl">
        
        {/* Background Layer with proper scaling */}
        <ImageWithFallback
          src={details.backdrop || details.image}
          alt={details.title}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Left Side Info */}
        <div className="relative flex-1 p-10 lg:p-14 flex flex-col justify-center gap-5 z-10 min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#850203] text-white uppercase tracking-wider shadow-sm">
                {type === 'series' ? 'TV Series' : type === 'anime' ? 'Anime' : 'Movie'}
              </span>
              {details.status && (
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider backdrop-blur-sm border border-white/10">
                  {details.status}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-5xl font-semibold uppercase tracking-widest leading-tight mb-3 text-white drop-shadow-xl">
                          {details.title}
                        </h1>
            

            {/* Meta info */}
            <div className="flex items-center gap-4 flex-wrap text-sm mb-4 font-medium text-white/90">
              {details.rating && (
                <span className="flex items-center gap-1.5 text-[#f5c518] font-semibold drop-shadow-md">
                  <Star size={16} fill="#f5c518" stroke="#f5c518" />
                  {details.rating}/10
                </span>
              )}
              <span className="flex items-center gap-1.5 drop-shadow-md">
                <Calendar size={15} className="opacity-70" /> {details.year}
              </span>
              {details.runtime && (
                <span className="flex items-center gap-1.5 drop-shadow-md">
                  <Clock size={15} className="opacity-70" /> {details.runtime} min
                </span>
              )}
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-5">
                {details.genres.map(g => (
                  <span key={g} className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold border border-white/10 backdrop-blur-sm">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              {videoSources.length > 0 && (
                <button
                  onClick={() => {
                    const player = document.getElementById('player');
                    if (player) player.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#850203] rounded-full text-white text-sm font-semibold hover:bg-[#5a0102] hover:scale-105 transition-all shadow-[0_0_15px_rgba(133,2,3,0.4)]"
                >
                  <Play className="fill-current" size={18} />
                  WATCH NOW
                </button>
              )}
              {details.trailer && (
                <button
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm font-semibold transition-all backdrop-blur-md"
                >
                  TRAILER
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Info (Description) */}
        <div className="relative w-full lg:w-[400px] xl:w-[480px] p-10 lg:p-14 flex flex-col gap-5 z-10 bg-[#1a1515]/60 border-l border-white/5">
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-xl tracking-widest font-semibold mb-4 text-white drop-shadow-md">
              Info
            </h3>
            <p className="text-[14px] opacity-70 leading-relaxed text-white/90 drop-shadow-md line-clamp-4 sm:line-clamp-5">
              {details.description}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-10">
        
        {/* Details Section */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-8">
          
          <div className="flex flex-col gap-6 flex-1">
            {/* Additional details */}
            {details.studios && details.studios.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs opacity-50 mt-2">
                  Studio: <span className="opacity-80 font-medium">{details.studios.join(', ')}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Video Player */}
        {videoSources.length > 0 && (
          <div id="player" className="w-full mt-4 scroll-mt-8">
            <div className="rounded-[25px] overflow-hidden shadow-2xl">
              <VideoPlayer
                sources={videoSources}
                title={details.title}
                mediaInfo={{
                  id: details.tmdb_id || details.id,
                  type: type,
                  season: currentSeason,
                  episode: currentEpisode
                }}
              />
            </div>
            {/* Episodes below player */}
            {(type === 'series' || type === 'anime') && (
              <div className="mt-8">
                <h2 className="text-2xl text-white tracking-wide font-semibold mb-2">
                  Episodes
                </h2>
                {renderEpisodes(type === 'anime' ? allAnimeEpisodes : episodes)}
              </div>
            )}
          </div>
        )}

        {/* Cast */}
        {details.cast && details.cast.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl text-white tracking-wide mb-6 font-semibold">Cast</h2>
            <div className="cast-grid">
              {details.cast.map((actor, i) => (
                <div key={i} className="cast-card">
                  {actor.image ? (
                    <img src={actor.image} alt={actor.name} className="cast-img" loading="lazy" />
                  ) : (
                    <div className="cast-img flex items-center justify-center text-2xl text-white/30 bg-[#1a1515]">
                      {actor.name?.[0]}
                    </div>
                  )}
                  <p className="cast-name">{actor.name}</p>
                  <p className="cast-character">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trailer Modal (if active) */}
        {showTrailer && details.trailer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 lg:p-20 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowTrailer(false)}>
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <iframe
                src={details.trailer}
                title="Trailer"
                allowFullScreen
                allow="autoplay; fullscreen"
                className="w-full h-full border-none"
              />
              <button 
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-[#850203] text-white rounded-full backdrop-blur-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {details.recommendations && details.recommendations.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl text-white tracking-wide font-semibold">More Like This</h2>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
            {details.recommendations.filter(i => i.image).map((item) => (
              <Link
                key={item.id}
                to={buildLink(item)}
                className="flex-none w-[200px] sm:w-[240px] h-[140px] sm:h-[160px] bg-[#1a1515] rounded-[20px] overflow-hidden snap-start relative group border border-white/5"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                  <p className="text-white font-semibold text-xs leading-tight truncate">{item.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {item.rating && (
                      <span className="text-[#f5c518] text-[10px] flex items-center gap-0.5">
                        <Star size={8} fill="#f5c518" stroke="#f5c518" />
                        {item.rating}
                      </span>
                    )}
                    <span className="text-white/40 text-[10px]">{item.year}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="text-white fill-white" size={36} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/5">
        <p>Strimo — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
}
