import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Film,
  Tv,
  Sparkles,
  TrendingUp,
  Calendar,
  History,
  Command,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar({ onOpenSearch, isSearchOpen }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Home', icon: Home, path: '/', section: 'BROWSE' },
    { name: 'Movies', icon: Film, path: '/discover/movie', section: 'BROWSE' },
    { name: 'TV Shows', icon: Tv, path: '/discover/tv', section: 'BROWSE' },
    { name: 'Top Anime', icon: Sparkles, path: '/discover/anime', section: 'BROWSE' },
    { name: 'History', icon: History, path: '/history', section: 'LIBRARY' },
  ];

  const browseItems = navItems.filter(item => item.section === 'BROWSE');
  const libraryItems = navItems.filter(item => item.section === 'LIBRARY');

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        title={!isExpanded ? item.name : ''}
        className={clsx(
          "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
          isActive
            ? "bg-[#850203]/10 text-white"
            : "text-[#e1dcd8]/40 hover:text-white hover:bg-white/5",
          !isExpanded && "justify-center px-0"
        )}
      >
        {isActive && isExpanded && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#850203] rounded-r-full shadow-[2px_0_10px_rgba(133,2,3,0.8)]" />
        )}
        <item.icon
          size={22}
          className={clsx(
            "transition-colors duration-300 shrink-0",
            isActive ? "text-[#850203]" : "group-hover:text-white"
          )}
          strokeWidth={isActive ? 2 : 1.5}
        />
        {isExpanded && (
          <span className="font-semibold text-base tracking-wide whitespace-nowrap overflow-hidden animate-in fade-in duration-500">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Header - Floating */}
      <div className="lg:hidden fixed top-4 left-4 right-4 h-16 bg-[#1a1717]/80 backdrop-blur-3xl border border-white/10 rounded-2xl z-[150] flex items-center px-5 justify-between shadow-2xl">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/logo_final.svg" alt="s" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center">
            <img src="/strimo-text.svg" alt="strimo" className="h-6 w-auto object-contain" />
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={clsx(
              'p-2.5 rounded-xl transition-all duration-300',
              location.pathname === '/' ? 'text-[#850203] bg-[#850203]/10 scale-105' : 'text-white/40 hover:text-white/80'
            )}
          >
            <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 1.5} />
          </Link>
          {!isSearchOpen && (
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl text-white/40 active:text-white transition-all hover:text-white/80 hover:bg-white/5"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar Wrapper */}
      <div
        className={clsx(
          "hidden lg:flex flex-col h-[calc(100vh-2rem)] bg-[#0f0d0d]/40 backdrop-blur-2xl border border-white/5 shrink-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-[100] m-4 rounded-2xl shadow-2xl",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        {/* Scrollable Content Container */}
        <div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar">
          {/* Brand Section */}
          <div className={clsx(
            "pt-8 pb-4 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isExpanded ? "px-6" : "px-4"
          )}>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110 shrink-0">
                <img src="/logo_final.svg" alt="Strimo" className="w-full h-full object-contain" />
              </div>
              {isExpanded && (
                <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-700">
                  <img src="/strimo-text.svg" alt="strimo" className="h-7 w-auto object-contain" />
                </div>
              )}
            </Link>
          </div>

          {/* Toggle Button - Now placed below logo */}
          <div className={clsx(
            "px-6 pb-6 flex transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isExpanded ? "justify-start" : "justify-center px-4"
          )}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 bg-white/5 hover:bg-[#850203] text-white/40 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer group"
              title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>


          {/* Search Bar */}

          <div className={clsx(
            "mb-8 transition-all duration-500",
            isExpanded ? "px-6" : "px-4"
          )}>
            {!isSearchOpen && (
              <button
                onClick={onOpenSearch}
                className={clsx(
                  "flex items-center bg-[#1a1717] hover:bg-[#221f1f] border border-white/5 rounded-2xl text-[#e1dcd8]/30 transition-all duration-300 group overflow-hidden",
                  isExpanded ? "w-full gap-3 px-4 py-3.5" : "w-12 h-12 justify-center p-0"
                )}

              >
                <Search size={18} className="group-hover:text-white/60 transition-colors shrink-0" />
                {isExpanded && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium group-hover:text-white/60 transition-colors whitespace-nowrap">Search...</span>

                  </>
                )}
              </button>
            )}
          </div>

          {/* Navigation Sections */}
          <div className={clsx(
            "flex-1 space-y-10 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isExpanded ? "px-4" : "px-2"
          )}>
            {/* Browse Section */}
            <div>
              {isExpanded && (
                <h3 className="px-4 mb-5 text-[11px] font-bold text-white/20 tracking-[0.2em] uppercase whitespace-nowrap animate-in fade-in duration-500">
                  Browse
                </h3>
              )}
              <div className="space-y-2.5">
                {browseItems.map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>

            {/* Library Section */}
            <div>
              {isExpanded && (
                <h3 className="px-4 mb-5 text-[11px] font-bold text-white/20 tracking-[0.2em] uppercase whitespace-nowrap animate-in fade-in duration-500">
                  Library
                </h3>
              )}
              <div className="space-y-2.5">
                {libraryItems.map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
          </div>
        </div>
      </div>



    </>
  );
}


