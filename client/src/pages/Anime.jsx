import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, TrendingUp, Flame } from 'lucide-react';
import MediaRow from '../components/MediaRow';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Anime = () => {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    axios.get(`${API}/anime/trending`).then(r => setTrending(r.data)).catch(() => {}).finally(() => setLoadingTrending(false));
    axios.get(`${API}/anime/popular`).then(r => setPopular(r.data)).catch(() => {}).finally(() => setLoadingPopular(false));
  }, []);

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>
          <Sparkles size={24} color="#9b59b6" />
          <span className="text-gradient-purple">Anime</span>
        </h1>
      </div>

      <MediaRow title="Currently Airing" items={trending} loading={loadingTrending} icon={<Flame size={18} color="#e50914" />} />
      <MediaRow title="Most Popular" items={popular} loading={loadingPopular} icon={<TrendingUp size={18} color="#f5c518" />} />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & IMDbOT</p>
      </footer>
    </div>
  );
};

export default Anime;
