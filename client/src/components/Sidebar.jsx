import { Link, useLocation } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar({ onOpenSearch }) {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center gap-5 pt-6 pb-10 pl-6 shrink-0 relative w-28 min-h-screen bg-[#292323]">
      {/* Logo Section */}
      <Link
        to="/"
        className="w-[72px] h-[72px] bg-gradient-to-br from-[#850203] to-[#5a0102] rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-[0_8px_20px_rgba(133,2,3,0.3)] hover:scale-105 transition-transform duration-300"
      >
        <img 
          src="/strimo-logo.svg" 
          alt="Strimo" 
          className="w-10 h-10" 
          onError={(e) => { 
            e.target.style.display = 'none'; 
            e.target.parentElement.textContent = 'S'; 
          }} 
        />
      </Link>

      {/* Nav Pill */}
      <div className="bg-[#1a1515] w-[76px] flex-1 rounded-[30px] flex flex-col items-center py-12 gap-10 relative overflow-hidden shadow-2xl border border-white/5">
        <Link
          to="/"
          title="Home"
          className={clsx(
            'flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-500 w-[60px] aspect-square group relative',
            location.pathname === '/'
              ? 'text-white bg-[#850203]/10'
              : 'text-[#e1dcd8]/40 hover:text-[#e1dcd8] hover:bg-white/5'
          )}
        >
          <Home 
            size={24} 
            className={clsx(
              'transition-all duration-500',
              location.pathname === '/' ? 'text-[#850203] scale-110' : 'text-inherit opacity-80 group-hover:opacity-100 group-hover:scale-110'
            )} 
            strokeWidth={1.5} 
          />
          <span className="text-[9px] font-bold tracking-wider uppercase">Home</span>
          {location.pathname === '/' && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#850203] rounded-r-full shadow-[4px_0_15px_rgba(133,2,3,0.5)]" />
          )}
        </Link>
        
        <button
          onClick={onOpenSearch}
          title="Search"
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-500 w-[60px] aspect-square group text-[#e1dcd8]/40 hover:text-[#e1dcd8] hover:bg-white/5 cursor-pointer"
        >
          <Search size={24} className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-wider uppercase">Search</span>
        </button>

        {/* Vertical branding */}
        <div className="mt-auto mb-8 flex items-center justify-center -rotate-90 origin-center absolute bottom-12">
          <span className="text-[#850203] text-sm tracking-[0.2em] whitespace-nowrap font-medium opacity-80">
            STRIMO
          </span>
        </div>
      </div>
    </div>
  );
}
