import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
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

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <Film color="#e50914" size={26} strokeWidth={2.5} />
          <span>Net<span style={{ color: '#e50914' }}>Fricks</span></span>
        </Link>

        <div className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={`link ${isActive('/')}`}>Home</Link>
          <Link to="/movies" className={`link ${isActive('/movies')}`}>Movies</Link>
          <Link to="/tv" className={`link ${isActive('/tv')}`}>TV Shows</Link>
          <Link to="/anime" className={`link ${isActive('/anime')}`}>Anime</Link>
        </div>
      </div>

      <div className="nav-right">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={16} color="#5c5c70" />
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
