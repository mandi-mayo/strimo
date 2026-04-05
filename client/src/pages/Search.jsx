import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Play } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error("Failed to search", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="page-container">
      <h2 className="section-title">
        {query ? <span>Search results for <span className="text-gradient">"{query}"</span></span> : <span>Discover</span>}
      </h2>

      {loading ? (
        <div className="spinner"></div>
      ) : results.length > 0 ? (
        <div className="media-grid">
          {results.map((item) => (
            <Link to={`/details/${item.id}?type=${item.type}&imdb=${item.imdb_id || ''}`} key={item.id + item.type} className="media-card">
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
                  <span>{item.type.toUpperCase()}</span>
                  <span>{item.year || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="error-txt">No results found for "{query}". Try a different term!</div>
      ) : (
        <div className="error-txt">Type something in the search bar to find your favorite movies and series.</div>
      )}
    </div>
  );
};

export default Search;
