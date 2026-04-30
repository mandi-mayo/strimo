import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import SearchModal from './SearchModal.jsx';

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#121212] text-white overflow-x-hidden" style={{ fontFamily: '"Playfair Display", serif' }}>
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Outlet />
      </main>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
