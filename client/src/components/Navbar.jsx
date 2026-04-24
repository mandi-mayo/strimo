import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Remove scroll effect - navbar is always visible
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <img src="/strimo-logo.svg" alt="STRIMO" style={{ height: '40px', width: 'auto' }} />
        </Link>
      </div>

      <div className="nav-right">
        <nav className="nav-links">
          <Link to="/" className="link">
            Home
          </Link>
        </nav>
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={16} color="#959ca3" />
          <input
            type="text"
            className="search-input"
            placeholder="Search movies, shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
