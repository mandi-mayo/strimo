import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Details = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'series';
  const imdbParam = searchParams.get('imdb');
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const url = `http://localhost:5000/api/details/${id}?type=${type}${imdbParam ? '&imdb='+imdbParam : ''}`;
        const response = await axios.get(url);
        setDetails(response.data);
        if (response.data.episodes && response.data.episodes.length > 0) {
           setCurrentSeason(response.data.episodes[0].season);
           setCurrentEpisode(response.data.episodes[0].number);
        }
      } catch (error) {
        console.error("Failed to fetch details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, type, imdbParam]);

  if (loading) return <div className="spinner"></div>;
  if (!details) return <div className="error-txt">Failed to load content details.</div>;

  const validImdbId = details.imdb_id;
  const iframeSrc = type === 'series' 
    ? `https://vidsrc.cc/v2/embed/tv/${validImdbId}/${currentSeason}/${currentEpisode}`
    : `https://vidsrc.cc/v2/embed/movie/${validImdbId}`;

  return (
    <div className="page-container" style={{paddingTop: 0}}>
      {/* Hero Section */}
      <div className="details-hero mt-20" style={{marginTop: '80px'}}>
        <img src={details.image || 'https://via.placeholder.com/300x450'} alt={details.title} className="details-poster" />
        <div className="details-info">
          <h1>{details.title}</h1>
          <div className="details-meta">
             {details.rating && <span className="rating">★ {details.rating}</span>}
             <span>{details.year}</span>
             <span className="tag" style={{background: 'rgba(229, 9, 20, 0.2)', color: '#e50914', border: '1px solid #e50914'}}>{type.toUpperCase()}</span>
          </div>
          
          <div style={{marginBottom: '1.5rem'}}>
            {details.genres && details.genres.map(g => (
                <span key={g} className="tag">{g}</span>
            ))}
          </div>
          
          <p className="details-desc">{details.description}</p>
        </div>
      </div>

      {/* Video Player */}
      {validImdbId ? (
          <div className="player-wrapper">
             <h2 className="section-title" style={{paddingLeft: 0}}><span className="text-gradient">Watch</span> Now</h2>
             <div className="player-container">
               <iframe 
                  src={iframeSrc}
                  allowFullScreen
                  title="Video Player"
                  referrerPolicy="origin"
                  sandbox="allow-same-origin allow-scripts allow-presentation"
               ></iframe>
             </div>
          </div>
      ) : (
          <div className="error-txt">No video stream available for this title (Missing IMDB ID).</div>
      )}

      {/* Episodes list for series */}
      {type === 'series' && details.episodes && details.episodes.length > 0 && (
          <div>
              <h2 className="section-title">Episodes</h2>
              <div className="episodes-grid">
                  {details.episodes.map(ep => (
                      <div 
                         key={ep.id} 
                         className={`episode-card ${ep.season === currentSeason && ep.number === currentEpisode ? 'active' : ''}`}
                         onClick={() => {
                             setCurrentSeason(ep.season);
                             setCurrentEpisode(ep.number);
                             window.scrollTo({ top: 400, behavior: 'smooth' });
                         }}
                      >
                          <div className="ep-title">{ep.season}x{ep.number} - {ep.name}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default Details;
