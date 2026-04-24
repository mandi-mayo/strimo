import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MediaRow from '../components/MediaRow';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Movies = () => {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loadingPop, setLoadingPop] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingUp, setLoadingUp] = useState(true);

  useEffect(() => {
    axios.get(`${API}/popular/movies`).then(r => setPopular(r.data)).catch(() => {}).finally(() => setLoadingPop(false));
    axios.get(`${API}/top-rated/movie`).then(r => setTopRated(r.data)).catch(() => {}).finally(() => setLoadingTop(false));
    axios.get(`${API}/upcoming`).then(r => setUpcoming(r.data)).catch(() => {}).finally(() => setLoadingUp(false));
  }, []);

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>
          Movies
        </h1>
      </div>

      <MediaRow title="Popular Now" items={popular} loading={loadingPop} />
      <MediaRow title="Top Rated" items={topRated} loading={loadingTop} />
      <MediaRow title="Coming Soon" items={upcoming} loading={loadingUp} />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
};

export default Movies;
