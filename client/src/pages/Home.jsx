import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Info, TrendingUp, Flame, Star, Sparkles, Tv } from 'lucide-react';
import MediaRow from '../components/MediaRow';
import SkeletonLoader from '../components/SkeletonLoader';

const API = 'http://localhost:5000/api';

const Home = () => {
  const [hero, setHero] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [anime, setAnime] = useState([]);

  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingTV, setLoadingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(true);

  useEffect(() => {
    // Fetch all sections in parallel
    axios.get(`${API}/trending`)
      .then(r => {
        setTrending(r.data);
        if (r.data.length > 0) {
          // Pick a random item from top 5 for hero
          const heroIdx = Math.floor(Math.random() * Math.min(5, r.data.length));
          setHero(r.data[heroIdx]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHero(false));

    axios.get(`${API}/popular/movies`)
      .then(r => setPopularMovies(r.data))
      .catch(() => {})
      .finally(() => setLoadingMovies(false));

    axios.get(`${API}/popular/tv`)
      .then(r => setPopularTV(r.data))
      .catch(() => {})
      .finally(() => setLoadingTV(false));

    axios.get(`${API}/top-rated/movie`)
      .then(r => setTopRated(r.data))
      .catch(() => {})
      .finally(() => setLoadingTopRated(false));

    axios.get(`${API}/upcoming`)
      .then(r => setUpcoming(r.data))
      .catch(() => {})
      .finally(() => setLoadingUpcoming(false));

    axios.get(`${API}/anime/trending`)
      .then(r => setAnime(r.data))
      .catch(() => {})
      .finally(() => setLoadingAnime(false));
  }, []);

  return (
    <div style={{ paddingTop: 0 }}>
      {/* Hero */}
      {loadingHero ? (
        <SkeletonLoader type="hero" />
      ) : hero ? (
        <section className="hero">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${hero.backdrop || hero.image})` }}
          />
          <div className="hero-gradient" />
          <div className="hero-content">
            <div className="hero-badge">
              <TrendingUp size={14} />
              Trending Now
            </div>
            <h1 className="hero-title">{hero.title}</h1>
            <div className="hero-meta">
              {hero.rating && (
                <span className="hero-meta-item rating">
                  <Star size={14} fill="#f5c518" stroke="#f5c518" />
                  {hero.rating}
                </span>
              )}
              <span className="hero-meta-item">{hero.year}</span>
              <span className="hero-meta-item" style={{ textTransform: 'capitalize' }}>
                {hero.type === 'series' ? 'TV Series' : hero.type}
              </span>
            </div>
            <p className="hero-desc">{hero.description}</p>
            <div className="hero-actions">
              <Link
                to={`/details/${hero.id}?type=${hero.type}${hero.imdb_id ? '&imdb=' + hero.imdb_id : ''}&source=${hero.source || 'tmdb'}`}
                className="btn btn-primary"
              >
                <Play fill="white" size={18} /> Watch Now
              </Link>
              <Link
                to={`/details/${hero.id}?type=${hero.type}${hero.imdb_id ? '&imdb=' + hero.imdb_id : ''}&source=${hero.source || 'tmdb'}`}
                className="btn btn-secondary"
              >
                <Info size={18} /> More Info
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Content Rows */}
      <MediaRow
        title="Trending This Week"
        items={trending}
        loading={loadingHero}
        gradient="text-gradient"
        showType={true}
        icon={<Flame size={20} color="#e50914" />}
      />

      <MediaRow
        title="Popular Movies"
        items={popularMovies}
        loading={loadingMovies}
        icon={<Sparkles size={18} color="#f5c518" />}
      />

      <MediaRow
        title="Popular TV Shows"
        items={popularTV}
        loading={loadingTV}
        icon={<Tv size={18} color="#2196f3" />}
      />

      <MediaRow
        title="Top Rated"
        items={topRated}
        loading={loadingTopRated}
        gradient="text-gradient-blue"
        icon={<Star size={18} color="#46d369" />}
      />

      <MediaRow
        title="Coming Soon"
        items={upcoming}
        loading={loadingUpcoming}
      />

      <MediaRow
        title="Trending Anime"
        items={anime}
        loading={loadingAnime}
        gradient="text-gradient-purple"
      />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & IMDbOT</p>
      </footer>
    </div>
  );
};

export default Home;
