import { Link, useLocation } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar({ onOpenSearch }) {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center gap-6 py-8 pl-5 shrink-0 relative w-24 min-h-screen">
      {/* Logo */}
      <Link
        to="/"
        className="w-[60px] h-[60px] bg-gradient-to-br from-[#e50914] to-[#b91c1c] rounded-full flex items-center justify-center text-white text-sm tracking-wider shrink-0 z-10 font-bold shadow-lg hover:scale-105 transition-transform duration-300 uppercase"
      >
        <img src="/strimo-logo.svg" alt="Strimo" className="w-8 h-8" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = 'S'; }} />
      </Link>

      {/* Nav Pill */}
      <div className="bg-[#1f1f1f] w-[72px] flex-1 rounded-[30px] flex flex-col items-center py-8 gap-6 relative overflow-hidden shadow-xl">
        <Link
          to="/"
          title="Home"
          className={clsx(
            'flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-300 w-14 hover:bg-white/10',
            location.pathname === '/'
              ? 'text-[#e50914] bg-white/5'
              : 'text-[#e50914]/60 hover:text-[#e50914]'
          )}
        >
          <Home size={26} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[9px] tracking-wide">Home</span>
        </Link>
        
        <button
          onClick={onOpenSearch}
          title="Search"
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-300 w-14 hover:bg-white/10 text-[#e50914]/60 hover:text-[#e50914] cursor-pointer"
        >
          <Search size={26} strokeWidth={2} />
          <span className="text-[9px] tracking-wide">Search</span>
        </button>

        {/* Vertical branding */}
        <div className="mt-auto mb-4 flex items-center justify-center -rotate-90 origin-center absolute bottom-[60px]">
          <span className="text-[#e50914] text-lg tracking-[0.96px] whitespace-nowrap font-semibold">
            STRIMO
          </span>
        </div>
      </div>
    </div>
  );
}
