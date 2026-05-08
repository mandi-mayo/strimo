import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Film, Tv, Sparkles, TrendingUp, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/', section: null },
  { icon: Film, label: 'Movies', path: '/', section: 'movies' },
  { icon: Tv, label: 'TV Shows', path: '/', section: 'tv' },
  { icon: Sparkles, label: 'Anime', path: '/', section: 'anime' },
  { icon: TrendingUp, label: 'Top Rated', path: '/', section: 'top-rated' },
  { icon: Calendar, label: 'Coming Soon', path: '/', section: 'upcoming' },
];

export default function Sidebar({ onOpenSearch, onScrollToSection }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const handleNavClick = (item) => {
    if (item.section && onScrollToSection) {
      onScrollToSection(item.section);
      setActiveSection(item.section);
    } else {
      setActiveSection(null);
    }
  };

  const isActive = (item) => {
    if (item.section) return activeSection === item.section;
    return location.pathname === item.path && !activeSection;
  };

  return (
    <div
      className={clsx(
        'flex flex-col shrink-0 min-h-screen bg-[#0d0b0b] border-r border-white/[0.04] transition-all duration-500 ease-out relative z-50',
        collapsed ? 'w-[72px]' : 'w-[220px]'
      )}
    >
      {/* Logo Area */}
      <div className={clsx(
        'flex items-center gap-3 px-5 h-[72px] shrink-0 border-b border-white/[0.04]',
        collapsed && 'justify-center px-0'
      )}>
        <Link to="/" onClick={() => setActiveSection(null)} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b91c1c] to-[#7f1d1d] flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-shadow duration-300">
            <span className="text-white font-bold text-sm tracking-tight">S</span>
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg tracking-tight">
              stri<span className="text-[#dc2626]">mo</span>
            </span>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[54px] w-6 h-6 bg-[#1a1717] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-[#292323] transition-all z-50 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Search */}
      <div className={clsx('px-3 mt-4 mb-2', collapsed && 'px-2')}>
        <button
          onClick={onOpenSearch}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl transition-all duration-300 cursor-pointer group',
            collapsed
              ? 'justify-center p-3 hover:bg-white/5'
              : 'px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05]'
          )}
        >
          <Search size={18} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
          {!collapsed && (
            <span className="text-white/30 text-sm group-hover:text-white/50 transition-colors">Search...</span>
          )}
          {!collapsed && (
            <span className="ml-auto text-[10px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">⌘K</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-px bg-white/[0.04]" />

      {/* Navigation label */}
      {!collapsed && (
        <div className="px-5 mb-1">
          <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">Browse</span>
        </div>
      )}

      {/* Nav Items */}
      <nav className={clsx('flex flex-col gap-0.5 px-3', collapsed && 'px-2 items-center')}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => handleNavClick(item)}
              className={clsx(
                'flex items-center gap-3 rounded-xl transition-all duration-300 relative group',
                collapsed ? 'w-11 h-11 justify-center' : 'px-4 py-2.5',
                active
                  ? 'bg-[#dc2626]/10 text-white'
                  : 'text-white/35 hover:text-white/80 hover:bg-white/[0.03]'
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {active && (
                <div className={clsx(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.5)]',
                  collapsed ? 'h-5 -left-2' : 'h-5'
                )} />
              )}
              <Icon
                size={19}
                strokeWidth={active ? 2 : 1.5}
                className={clsx(
                  'transition-all duration-300 shrink-0',
                  active ? 'text-[#dc2626]' : 'group-hover:scale-105'
                )}
              />
              {!collapsed && (
                <span className={clsx(
                  'text-[13px] transition-all duration-300',
                  active ? 'font-semibold' : 'font-medium'
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 h-px bg-white/[0.04]" />

      {/* Library Section */}
      {!collapsed && (
        <div className="px-5 mb-1">
          <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">Library</span>
        </div>
      )}

      <div className={clsx('flex flex-col gap-0.5 px-3', collapsed && 'px-2 items-center')}>
        <Link
          to="/"
          onClick={() => {
            setActiveSection('history');
            onScrollToSection?.('history');
          }}
          className={clsx(
            'flex items-center gap-3 rounded-xl transition-all duration-300 group',
            collapsed ? 'w-11 h-11 justify-center' : 'px-4 py-2.5',
            activeSection === 'history'
              ? 'bg-[#dc2626]/10 text-white'
              : 'text-white/35 hover:text-white/80 hover:bg-white/[0.03]'
          )}
          title={collapsed ? 'Watch History' : undefined}
        >
          <Clock
            size={19}
            strokeWidth={activeSection === 'history' ? 2 : 1.5}
            className={clsx(
              'transition-all duration-300 shrink-0',
              activeSection === 'history' ? 'text-[#dc2626]' : 'group-hover:scale-105'
            )}
          />
          {!collapsed && (
            <span className={clsx(
              'text-[13px] font-medium transition-all duration-300',
              activeSection === 'history' && 'font-semibold'
            )}>
              History
            </span>
          )}
        </Link>
      </div>

      {/* Bottom branding */}
      <div className="mt-auto pb-5 flex flex-col items-center gap-2">
        {!collapsed && (
          <div className="px-4 w-full">
            <div className="bg-gradient-to-r from-[#dc2626]/10 to-transparent rounded-xl p-3 border border-[#dc2626]/10">
              <p className="text-[10px] text-white/40 leading-relaxed">
                Powered by TMDB, Jikan & OMDb
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#b91c1c]/20 to-transparent flex items-center justify-center">
            <span className="text-[#dc2626]/40 text-[9px] font-bold">S</span>
          </div>
        )}
      </div>
    </div>
  );
}
