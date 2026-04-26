import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Star, Clock, Calendar, Award } from 'lucide-react';
import MediaRow from '../components/MediaRow';
import SkeletonLoader from '../components/SkeletonLoader';
import VideoPlayer from '../components/VideoPlayer';
import TrailerModal from '../components/TrailerModal';

const API = (import.meta.env.VITE_API_URL || 'https://strimo-b8v4.onrender.com') + '/api';

const Details = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const imdbParam = searchParams.get('imdb');
  const malParam = searchParams.get('mal');
  const source = searchParams.get('source') || 'tmdb';

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trailer Modal State
  const [showTrailer, setShowTrailer] = useState(false);

  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Video playback state
  const [playbackStatus, setPlaybackStatus] = useState('idle'); // idle, loading, playing, error

  // Memoized callback to prevent unnecessary re-renders in VideoPlayer
  const handlePlaybackStateChange = useCallback((status) => {
    setPlaybackStatus(status);
    console.log(`📊 Playback status: ${status}`);
  }, []);

  // Fetch details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        let data;
        if (type === 'anime' && malParam) {
          const res = await axios.get(`${API}/anime/details/${malParam}`);
          data = res.data;
        } else {
          const url = `${API}/details/${id}?type=${type}${imdbParam ? '&imdb=' + imdbParam : ''}&source=${source}`;
          const res = await axios.get(url);
          data = res.data;
        }
        setDetails(data);

        // Set initial season/episode
        if (data.seasons && data.seasons.length > 0) {
          setCurrentSeason(data.seasons[0].season_number);
        } else if (data.episodes && data.episodes.length > 0) {
          setCurrentSeason(data.episodes[0].season || 1);
          setCurrentEpisode(data.episodes[0].number || 1);
          setEpisodes(data.episodes);
        }
      } catch (error) {
        console.error("Failed to fetch details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
    window.scrollTo(0, 0);
  }, [id, type, imdbParam, malParam, source]);

  // Reset player state when episode, season, or title changes
  useEffect(() => {
    setPlaybackStatus('idle');
    console.log(`🎬 Video source changed: Season ${currentSeason}, Episode ${currentEpisode}`);
  }, [currentSeason, currentEpisode, id]);

  // Fetch episodes for selected season (TMDB)
  useEffect(() => {
    if (!details || type === 'anime' || !details.seasons || details.source !== 'tmdb') return;
    setEpisodesLoading(true);
    axios.get(`${API}/season/${details.tmdb_id || details.id}/${currentSeason}`)
      .then(r => {
        setEpisodes(r.data);
        if (r.data.length > 0) {
          setCurrentEpisode(r.data[0].number);
        }
      })
      .catch(() => setEpisodes([]))
      .finally(() => setEpisodesLoading(false));
  }, [currentSeason, details]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!details) return <div className="error-txt">Failed to load content details.</div>;

  const imdbId = details.imdb_id;
  
  // Define multiple reliable sources with proper error handling
  const getSources = () => {
    const isTmdb = details.source === 'tmdb';
    const tmdbId = isTmdb ? (details.tmdb_id || details.id) : details.tmdb_id;
    const imdbId = details.imdb_id;
    const malId = details.mal_id;
    
    // We need at least one valid ID
    const mediaId = tmdbId || imdbId || malId;
    
    if (!mediaId) return [];

    const sources = [];

    if (type === 'anime') {
      // Anime sources
      if (malId) {
        sources.push({
          name: '🎬 VidLink PRO (Anime)',
          url: `https://vidlink.pro/anime/${malId}/${currentEpisode}`,
          priority: 1
        });
        sources.push({
          name: '📺 VidSrc PM (Anime)',
          url: `https://vidsrc.pm/embed/anime/${malId}/${currentEpisode}`,
          priority: 2
        });
        sources.push({
          name: '📽️ AutoEmbed (Anime)',
          url: `https://autoembed.to/tv/tmdb/${malId}-${currentSeason}-${currentEpisode}`, // Fallback attempt
          priority: 3
        });
      }
    } else if (type === 'series') {
      // TV Series sources
      if (tmdbId) {
        sources.push({
          name: '🎬 VidLink PRO (Ad-Free)',
          url: `https://vidlink.pro/tv/${tmdbId}/${currentSeason}/${currentEpisode}`,
          priority: 1
        });
      }
      sources.push({
        name: '📺 VidSrc PM',
        url: imdbId 
          ? `https://vidsrc.pm/embed/tv?imdb=${imdbId}&season=${currentSeason}&episode=${currentEpisode}`
          : `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`,
        priority: 2
      });
      if (tmdbId) {
        sources.push({
          name: '📽️ AutoEmbed',
          url: `https://autoembed.to/tv/tmdb/${tmdbId}-${currentSeason}-${currentEpisode}`,
          priority: 3
        });
        sources.push({
          name: '🎞️ VidSrc XYZ',
          url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`,
          priority: 4
        });
        sources.push({
          name: '🌐 MultiEmbed',
          url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`,
          priority: 5
        });
        sources.push({
          name: '⚡ SmashyStream',
          url: `https://embed.smashystream.com/play1.php?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`,
          priority: 6
        });
        sources.push({
          name: '🔥 SuperEmbed',
          url: `https://superembed.stream/se_player.php?video_id=${tmdbId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`,
          priority: 7
        });
        sources.push({
          name: '🍿 2Embed',
          url: `https://www.2embed.ru/embed/tmdb/tv?id=${tmdbId}&s=${currentSeason}&e=${currentEpisode}`,
          priority: 8
        });
        sources.push({
          name: '⌚ xpWatch',
          url: `https://xpwatch-v2.pages.dev/tv/${tmdbId}`,
          priority: 9
        });
        sources.push({
          name: '🥦 BrocoFlix',
          url: `https://brocoflix.xyz/tv/${tmdbId}/${currentSeason}/${currentEpisode}`,
          priority: 10
        });
        sources.push({
          name: '🧲 WebTorrent',
          url: `https://webtorrent.io/desktop/`,
          priority: 11
        });
      }
    } else {
      // Movies sources
      sources.push({
        name: '🎬 VidLink PRO (Ad-Free)',
        url: `https://vidlink.pro/movie/${mediaId}`,
        priority: 1
      });
      sources.push({
        name: '📺 VidSrc PM',
        url: imdbId
          ? `https://vidsrc.pm/embed/movie?imdb=${imdbId}`
          : `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}`,
        priority: 2
      });
      if (tmdbId) {
        sources.push({
          name: '📽️ AutoEmbed',
          url: `https://autoembed.to/movie/tmdb/${tmdbId}`,
          priority: 3
        });
        sources.push({
          name: '🎞️ VidSrc XYZ',
          url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`,
          priority: 4
        });
        sources.push({
          name: '🌐 MultiEmbed',
          url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
          priority: 5
        });
        sources.push({
          name: '⚡ SmashyStream',
          url: `https://embed.smashystream.com/play1.php?tmdb=${tmdbId}`,
          priority: 6
        });
        sources.push({
          name: '🔥 SuperEmbed',
          url: `https://superembed.stream/se_player.php?video_id=${tmdbId}&tmdb=1`,
          priority: 7
        });
        sources.push({
          name: '🍿 2Embed',
          url: `https://www.2embed.ru/embed/tmdb/movie?id=${tmdbId}`,
          priority: 8
        });
        sources.push({
          name: '⌚ xpWatch',
          url: `https://xpwatch-v2.pages.dev/movie/${tmdbId}`,
          priority: 9
        });
        sources.push({
          name: '🥦 BrocoFlix',
          url: `https://brocoflix.xyz/movie/${tmdbId}`,
          priority: 10
        });
        sources.push({
          name: '🧲 WebTorrent',
          url: `https://webtorrent.io/desktop/`,
          priority: 11
        });
      }
    }

    return sources.sort((a, b) => a.priority - b.priority);
  };

  const sources = getSources();
  const playerSrc = sources.length > 0 ? sources[0]?.url : null;
  const playerUnavailable = !playerSrc && type !== 'anime';

  const omdb = details.omdbRatings;

  return (
    <div style={{ paddingTop: 0 }}>
      {/* Backdrop Hero */}
      <div className="details-backdrop">
        <div
          className="details-backdrop-img"
          style={{ backgroundImage: `url(${details.backdrop || details.image})` }}
        />
        <div className="details-backdrop-gradient" />

        <div className="details-hero">
          <div className="details-poster-wrap">
            <img
              src={details.image || ''}
              alt={details.title}
              className="details-poster"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="details-info">
            <h1>{details.title}</h1>
            {details.tagline && <p className="details-tagline">"{details.tagline}"</p>}

            <div className="details-meta">
              {details.rating && (
                <span className="details-meta-item" style={{ color: '#f5c518', fontWeight: 700 }}>
                  <Star size={15} fill="#f5c518" stroke="#f5c518" />
                  {details.rating}/10
                </span>
              )}
              <span className="details-meta-item">
                <Calendar size={14} /> {details.year}
              </span>
              {details.runtime && (
                <span className="details-meta-item">
                  <Clock size={14} /> {details.runtime} min
                </span>
              )}
              <span className="tag accent">
                {type === 'series' ? 'TV SERIES' : type === 'anime' ? 'ANIME' : 'MOVIE'}
              </span>
            </div>

            {/* Multi-source Ratings */}
            {omdb && (
              <div className="ratings-row">
                {omdb.imdb && (
                  <div className="rating-badge imdb">
                    <span className="label">IMDb</span>
                    <span className="value">{omdb.imdb}</span>
                  </div>
                )}
                {omdb.rottenTomatoes && (
                  <div className="rating-badge rt">
                    <span className="label">🍅</span>
                    <span className="value">{omdb.rottenTomatoes}</span>
                  </div>
                )}
                {omdb.metacritic && omdb.metacritic !== 'N/A' && (
                  <div className="rating-badge mc">
                    <span className="label">Metacritic</span>
                    <span className="value">{omdb.metacritic}</span>
                  </div>
                )}
                {omdb.rated && omdb.rated !== 'N/A' && (
                  <div className="rating-badge">
                    <span className="value" style={{ color: 'var(--text-secondary)' }}>{omdb.rated}</span>
                  </div>
                )}
              </div>
            )}

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="tags-row">
                {details.genres.map(g => <span key={g} className="tag">{g}</span>)}
              </div>
            )}

            {/* Awards */}
            {omdb?.awards && omdb.awards !== 'N/A' && (
              <p style={{ fontSize: '0.82rem', color: 'var(--gold)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={14} /> {omdb.awards}
              </p>
            )}

            <p className="details-desc">{details.description}</p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {playerSrc && (
                <a href="#player" className="btn btn-primary">
                  <Play fill="white" size={18} /> Watch Now
                </a>
              )}
              {details.trailer && (
                <button 
                  onClick={() => setShowTrailer(true)} 
                  className="btn btn-secondary"
                >
                  <Play size={18} /> Trailer
                </button>
              )}
            </div>

            {/* Studios for anime */}
            {details.studios && details.studios.length > 0 && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
                Studio: <span style={{ color: 'var(--text-secondary)' }}>{details.studios.join(', ')}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal 
        isOpen={showTrailer} 
        onClose={() => setShowTrailer(false)} 
        trailerUrl={details.trailer} 
        title={details.title} 
      />

      {/* Video Player */}
      {playerSrc && (
        <div className="player-section" id="player">
          <div className="section-header" style={{ padding: 0, marginBottom: '1rem', marginTop: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Watch Now
            </h2>
          </div>

          <VideoPlayer
            sources={sources}
            title={details.title}
            onPlaybackStateChange={handlePlaybackStateChange}
            loadingTimeout={15000}
          />
        </div>
      )}

      {/* Player Unavailable */}
      {playerUnavailable && (
        <div className="player-section" id="player">
          <div className="section-header" style={{ padding: 0, marginBottom: '1rem', marginTop: '1rem' }}>
            <h2 className="section-title">
              Watch Now
            </h2>
          </div>
          <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderRadius: '0.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p>Video player unavailable for this title. Please try external streaming services.</p>
          </div>
        </div>
      )}

      {/* Cast */}
      {details.cast && details.cast.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Cast</h2>
          </div>
          <div className="cast-grid">
            {details.cast.map((actor, i) => (
              <div key={i} className="cast-card">
                {actor.image ? (
                  <img src={actor.image} alt={actor.name} className="cast-img" loading="lazy" />
                ) : (
                  <div className="cast-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
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

      {/* Season / Episode Picker */}
      {type === 'series' && (details.seasons?.length > 0 || episodes.length > 0) && (
        <div className="season-picker">
          <div className="season-selector">
            <h2 className="section-title" style={{ margin: 0 }}>Episodes</h2>
            {details.seasons && details.seasons.length > 0 && (
              <select
                className="season-select"
                value={currentSeason}
                onChange={(e) => setCurrentSeason(Number(e.target.value))}
              >
                {details.seasons.map(s => (
                  <option key={s.season_number} value={s.season_number}>
                    Season {s.season_number} ({s.episode_count} eps)
                  </option>
                ))}
              </select>
            )}
          </div>

          {episodesLoading ? (
            <SkeletonLoader type="grid" count={6} />
          ) : (
            <div className="episodes-grid">
              {episodes.map(ep => (
                <div
                  key={ep.id || ep.number}
                  className={`episode-card ${ep.season === currentSeason && ep.number === currentEpisode ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSeason(ep.season || currentSeason);
                    setCurrentEpisode(ep.number);
                    const player = document.getElementById('player');
                    if (player) player.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  {ep.image && (
                    <img src={ep.image} alt={ep.name} className="episode-thumb" loading="lazy" />
                  )}
                  <div className="episode-info">
                    <span className="ep-number">Episode {ep.number}</span>
                    <div className="ep-title">{ep.name || `Episode ${ep.number}`}</div>
                    <div className="ep-meta">
                      {ep.runtime && <span>{ep.runtime} min</span>}
                      {ep.rating ? <span> · ★ {Math.round(ep.rating * 10) / 10}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Anime episodes */}
      {type === 'anime' && episodes.length > 0 && (
        <div className="season-picker">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Episodes</h2>
          <div className="episodes-grid">
            {episodes.map(ep => (
              <div
                key={ep.id || ep.number}
                className={`episode-card ${ep.number === currentEpisode ? 'active' : ''}`}
                onClick={() => {
                  setCurrentEpisode(ep.number);
                  const player = document.getElementById('player');
                  if (player) player.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <div className="episode-info">
                  <span className="ep-number">Episode {ep.number}</span>
                  <div className="ep-title">{ep.name || `Episode ${ep.number}`}</div>
                  {ep.filler && <span className="tag" style={{ marginTop: '0.3rem', background: 'rgba(255, 71, 87, 0.2)', color: '#ff4757' }}>Filler</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {details.recommendations && details.recommendations.length > 0 && (
        <MediaRow
          title="More Like This"
          items={details.recommendations}
          showType={true}
        />
      )}

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
};

export default Details;
