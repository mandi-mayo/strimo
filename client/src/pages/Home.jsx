import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play } from 'lucide-react';

const Home = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/trending');
        setTrending(response.data);
      } catch (error) {
        console.error("Failed to fetch trending", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) return <div className="spinner"></div>;

  const heroItem = trending[0] || null;

  return (
    <div className="page-container" style={{ paddingTop: 0 }}>
      {heroItem && (
        <section className="hero">
          <div className="hero-bg" style={{ backgroundImage: `url(${heroItem.image})` }}></div>
          <div className="hero-gradient"></div>
          <div className="hero-content">
            <h1 className="hero-title">{heroItem.title}</h1>
            <p className="hero-desc">{heroItem.description}</p>
            <div>
              <Link to={`/details/${heroItem.id}?type=${heroItem.type}`} className="btn">
                <Play fill="white" size={20} /> Watch Now
              </Link>
            </div>
          </div>
        </section>
      )}

      <h2 className="section-title">
        <span className="text-gradient">Trending</span> Now
      </h2>
      
      <div className="media-grid">
        {trending.slice(1).map((item) => (
          <Link to={`/details/${item.id}?type=${item.type}`} key={item.id} className="media-card">
            <div className="media-poster-container">
              <img src={item.image || 'https://via.placeholder.com/300x450?text=No+Image'} alt={item.title} className="media-poster" />
              <div className="media-overlay">
                <button className="media-play-icon">
                  <Play fill="white" size={24} />
                </button>
              </div>
            </div>
            <div className="media-info">
              <h3 className="media-title">{item.title}</h3>
              <div className="media-meta">
                <span>{item.year || 'N/A'}</span>
                {item.rating && <span className="rating">★ {item.rating}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
