import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Info } from 'lucide-react';
import MediaRow from '../components/MediaRow';
import SkeletonLoader from '../components/SkeletonLoader';

const API = (import.meta.env.VITE_API_URL || 'https://strimo-b8v4.onrender.com') + '/api';

const Home = () => {
  const [hero, setHero] = useState(null);
  const [trending, setTrending] = useState([]);
  const [anime, setAnime] = useState([]);

  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(true);

  useEffect(() => {
    // Fetch essential sections only
    axios.get(`${API}/trending`)
      .then(r => {
        setTrending(r.data);
        if (r.data.length > 0) {
          const heroIdx = Math.floor(Math.random() * Math.min(5, r.data.length));
          setHero(r.data[heroIdx]);
        }
      })
      .catch((err) => {
        console.error("Trending fetch error:", err.message);
      })
      .finally(() => setLoadingHero(false));

    axios.get(`${API}/anime/trending`)
      .then(r => {
        console.log("Anime trending response:", r.data);
        setAnime(r.data || []);
      })
      .catch((err) => {
        console.error("Anime trending fetch error:", err.message);
        setAnime([]);
      })
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
              Trending Now
            </div>
            <h1 className="hero-title">{hero.title}</h1>
            <div className="hero-meta">
              {hero.rating && (
                <span className="hero-meta-item rating">
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
        showType={true}
      />

      <MediaRow
        title="Trending Anime"
        items={anime}
        loading={loadingAnime}
      />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
};

export default Home;
