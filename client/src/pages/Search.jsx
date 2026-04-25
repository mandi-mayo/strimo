import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SearchX, Search as SearchIcon } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import SkeletonLoader from '../components/SkeletonLoader';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  const [results, setResults] = useState([]);
  const [animeResults, setAnimeResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreResults, setGenreResults] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);

  // Fetch genres on mount
  useEffect(() => {
    axios.get(`${API}/genres`)
      .then(r => setGenres(r.data))
      .catch(() => {});
  }, []);

  // Search when query or type changes
  useEffect(() => {
    if (!query && !type) {
      setResults([]);
      setAnimeResults([]);
      return;
    }

    setLoading(true);
    setSelectedGenre(null);

    if (query) {
      // Search logic
      Promise.all([
        axios.get(`${API}/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: [] })),
        axios.get(`${API}/anime/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: [] }))
      ]).then(([mainRes, animeRes]) => {
        setResults(mainRes.data);
        setAnimeResults(animeRes.data);
      }).finally(() => setLoading(false));
    } else if (type) {
      // Browse logic
      let endpoint = '';
      if (type === 'movie') endpoint = '/popular/movies';
      else if (type === 'series') endpoint = '/popular/tv';
      else if (type === 'anime') endpoint = '/anime/popular';

      axios.get(`${API}${endpoint}`)
        .then(r => {
          if (type === 'anime') {
            setAnimeResults(r.data);
            setResults([]);
          } else {
            setResults(r.data);
            setAnimeResults([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [query, type]);

  // Genre browse
  const handleGenreClick = (genre) => {
    if (selectedGenre === genre.id) {
      setSelectedGenre(null);
      setGenreResults([]);
      return;
    }
    setSelectedGenre(genre.id);
    setGenreLoading(true);
    axios.get(`${API}/discover/${genre.id}`)
      .then(r => setGenreResults(r.data))
      .catch(() => setGenreResults([]))
      .finally(() => setGenreLoading(false));
  };

  const allResults = [...results, ...animeResults];

  return (
    <div className="page-container">
      {/* Search Header */}
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h2 className="section-title">
          {query ? (
            <span>
              Results for "{query}"
            </span>
          ) : type ? (
            <span style={{ textTransform: 'capitalize' }}>
              {type === 'series' ? 'TV Shows' : type}
            </span>
          ) : (
            <span>Discover</span>
          )}
        </h2>
        {allResults.length > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {allResults.length} results
          </span>
        )}
      </div>

      {/* Genre Pills */}
      {!query && genres.length > 0 && (
        <div className="genre-pills">
          {genres.map(genre => (
            <button
              key={genre.id}
              className={`genre-pill ${selectedGenre === genre.id ? 'active' : ''}`}
              onClick={() => handleGenreClick(genre)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* Genre Browse Results */}
      {!query && selectedGenre && (
        genreLoading ? (
          <SkeletonLoader type="grid" count={12} />
        ) : (
          <div className="media-grid">
            {genreResults.filter(item => item.image).map((item, idx) => (
              <MediaCard key={`${item.id}-${idx}`} item={item} showType />
            ))}
          </div>
        )
      )}

      {/* Search Results */}
      {loading ? (
        <SkeletonLoader type="grid" count={12} />
      ) : allResults.length > 0 ? (
        <div className="media-grid">
          {allResults.filter(item => item.image).map((item, idx) => (
            <MediaCard key={`${item.id}-${idx}`} item={item} showType />
          ))}
        </div>
      ) : query ? (
        <div className="empty-state">
          <SearchX size={56} />
          <h3>No results found</h3>
          <p>We couldn't find anything for "{query}". Try a different search term.</p>
        </div>
      ) : !selectedGenre ? (
        <div className="empty-state">
          <SearchIcon size={56} />
          <h3>Search for anything</h3>
          <p>Find your favorite movies, TV shows, and anime. Or browse by genre above.</p>
        </div>
      ) : null}

      <footer className="footer">
        <p>NetFricks — Powered by TMDB, TVMaze, Jikan & OMDb</p>
      </footer>
    </div>
  );
};

export default Search;
