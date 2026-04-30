import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, Server, ChevronDown } from 'lucide-react';

/**
 * VideoPlayer - Simplified, stable video streaming player
 * Adapted to the new Strimo UI design with warm brown palette
 */
const VideoPlayer = ({ sources = [], title = 'Video', debug = false }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [attemptedSources, setAttemptedSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const iframeRef = useRef(null);
  const dropdownRef = useRef(null);

  const validSources = sources.filter(s => s?.url && typeof s.url === 'string');
  const currentSource = validSources[currentSourceIndex];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSourceChange = (newIndex) => {
    setIsLoading(true);
    setCurrentSourceIndex(newIndex);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentSourceIndex]);

  const handleIframeLoad = () => setIsLoading(false);

  const handleIframeError = useCallback(() => {
    setAttemptedSources(prev => prev.includes(currentSourceIndex) ? prev : [...prev, currentSourceIndex]);
    setIsLoading(false);
    if (debug) console.error(`[VideoPlayer] Failed to load Server ${currentSourceIndex + 1}`);
  }, [currentSourceIndex, debug]);

  if (!validSources.length) {
    return (
      <div className="video-player-error">
        <AlertCircle size={48} className="mb-2 text-[#e50914]" />
        <h3 className="text-white text-lg font-semibold">No Video Sources</h3>
        <p className="text-white/50 text-sm">No valid video sources available for this title.</p>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper flex flex-col rounded-[25px] overflow-hidden shadow-2xl bg-[#0f0f0f]">
      {/* Server selector */}
      {validSources.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-[#1f1f1f]/80 backdrop-blur-xl border-b border-white/5 relative z-20">
          <div className="flex items-center gap-2 text-white/70 font-medium">
            <Server size={18} className="text-[#e50914]" />
            <span className="hidden sm:inline">Server:</span>
          </div>
          
          <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full sm:w-auto gap-3 px-4 py-2 bg-black/20 hover:bg-black/40 border border-white/10 rounded-xl text-white transition-all duration-300"
            >
              <span className="font-medium truncate">{currentSource?.name}</span>
              {attemptedSources.includes(currentSourceIndex) && (
                <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full whitespace-nowrap">Failed</span>
              )}
              <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-64 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col p-1.5 gap-0.5 max-h-[300px] overflow-y-auto hide-scrollbar">
                  {validSources.map((source, idx) => {
                    const isSelected = idx === currentSourceIndex;
                    const hasFailed = attemptedSources.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSourceChange(idx)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-[#e50914] text-white font-medium' 
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate pr-2">{source.name}</span>
                        {hasFailed && (
                          <span className="text-[10px] text-red-300 uppercase tracking-wider font-bold shrink-0 bg-red-500/20 px-1.5 py-0.5 rounded">Failed</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="ml-auto text-xs font-semibold text-white/40 bg-black/20 px-3 py-1.5 rounded-lg hidden sm:block">
            {currentSourceIndex + 1} of {validSources.length}
          </div>
        </div>
      )}

      {/* Player container */}
      <div className="w-full aspect-video relative overflow-hidden bg-[#0f0f0f] z-10">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0f0f0f] gap-4">
            <div className="spinner" />
            <p className="text-white/40 text-sm animate-pulse">Connecting to {currentSource?.name}...</p>
          </div>
        )}

        {currentSource && (
          <iframe
            ref={iframeRef}
            src={currentSource.url}
            title={`${title} - ${currentSource.name}`}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-full border-none absolute inset-0 z-0 transition-opacity duration-500"
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
