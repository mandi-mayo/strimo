import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import SearchModal from './SearchModal.jsx';
import { isSafeUrl } from '../utils/security';

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Redirect / External Link Guard
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        const url = target.href;
        const isExternal = !url.includes(window.location.origin);
        
        if (isExternal && !isSafeUrl(url)) {
          e.preventDefault();
          console.warn(`[Security Guard] Blocked unsafe redirect to: ${url}`);
          alert("For your security, this external link has been blocked. Strimo only allows redirects to trusted partners.");
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#292323] text-white overflow-x-hidden" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Outlet />
      </main>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
