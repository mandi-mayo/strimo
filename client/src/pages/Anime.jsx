import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MediaRow from '../components/MediaRow';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Anime = () => {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    axios.get(`${API}/anime/trending`)
      .then(r => {
        console.log("Anime trending response:", r.data);
        setTrending(r.data);
      })
      .catch((err) => {
        console.error("Anime trending error:", err.message);
      })
      .finally(() => setLoadingTrending(false));

    axios.get(`${API}/anime/popular`)
      .then(r => {
        console.log("Anime popular response:", r.data);
        setPopular(r.data);
      })
      .catch((err) => {
        console.error("Anime popular error:", err.message);
      })
      .finally(() => setLoadingPopular(false));
  }, []);

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>
          Anime
        </h1>
      </div>

      <MediaRow title="Currently Airing" items={trending} loading={loadingTrending} />
      <MediaRow title="Most Popular" items={popular} loading={loadingPopular} />

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
};

export default Anime;
