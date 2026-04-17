import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tv, TrendingUp, Star } from 'lucide-react';
import MediaRow from '../components/MediaRow';

const API = 'http://localhost:5000/api';

const TVShows = () => {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loadingPop, setLoadingPop] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    axios.get(`${API}/popular/tv`).then(r => setPopular(r.data)).catch(() => {}).finally(() => setLoadingPop(false));
    axios.get(`${API}/top-rated/tv`).then(r => setTopRated(r.data)).catch(() => {}).finally(() => setLoadingTop(false));
  }, []);

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>
          <Tv size={24} color="#2196f3" />
          <span className="text-gradient-blue">TV Shows</span>
        </h1>
      </div>

      <MediaRow title="Popular Now" items={popular} loading={loadingPop} icon={<TrendingUp size={18} color="#f5c518" />} />
      <MediaRow title="Top Rated" items={topRated} loading={loadingTop} icon={<Star size={18} color="#46d369" />} />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & IMDbOT</p>
      </footer>
    </div>
  );
};

export default TVShows;
