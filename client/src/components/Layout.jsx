import { Outlet } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import SearchModal from './SearchModal.jsx';
import { isSafeUrl } from '../utils/security';

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#111010] text-white overflow-x-hidden" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} onScrollToSection={scrollToSection} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Outlet context={{ scrollToSection }} />
      </main>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
