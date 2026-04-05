import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film } from 'lucide-react';

const Navbar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery('');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <Film color="#e50914" size={28} />
        <span>NetFricks</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className="link">Home</Link>
        <Link to="/search" className="link">Discover</Link>
        
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={18} color="#9aa0a6" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Movies, shows..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
