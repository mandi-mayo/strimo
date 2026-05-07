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
      <div className="bg-[#1a1515] w-[76px] flex-1 rounded-[20px] flex flex-col items-center py-10 gap-8 relative overflow-hidden shadow-2xl border border-white/5">
        <Link
          to="/"
          title="Home"
          className={clsx(
            'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl transition-all duration-300 w-16 group',
            location.pathname === '/'
              ? 'text-white bg-white/5'
              : 'text-[#e1dcd8]/40 hover:text-[#e1dcd8] hover:bg-white/5'
          )}
        >
          <Home 
            size={24} 
            className={clsx(
              'transition-colors',
              location.pathname === '/' ? 'text-[#850203]' : 'text-inherit opacity-80 group-hover:opacity-100'
            )} 
            strokeWidth={1.5} 
          />
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </Link>
        
        <button
          onClick={onOpenSearch}
          title="Search"
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl transition-all duration-300 w-16 group text-[#e1dcd8]/40 hover:text-[#e1dcd8] hover:bg-white/5 cursor-pointer"
        >
          <Search size={24} className="opacity-80 group-hover:opacity-100 transition-colors" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-tight">Search</span>
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
