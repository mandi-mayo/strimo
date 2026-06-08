import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, Server, Play } from 'lucide-react';

/**
 * VideoPlayer - Advanced streaming player with Cinematic UI
 * Supports subtitle sync, multi-tracks, and high-performance streaming
 */
const VideoPlayer = ({ sources = [], title = 'Video', mediaInfo = {}, debug = false }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [attemptedSources, setAttemptedSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const iframeRef = useRef(null);


  const validSources = sources.filter(s => s?.url && typeof s.url === 'string');
  const currentSource = validSources[currentSourceIndex];

  // Set loading to false after source changes (iframe onLoad handles the rest)
  useEffect(() => {
    setIsLoading(true);
  }, [currentSourceIndex]);


  // Last-resort: kill window.open on the parent frame too
  useEffect(() => {
    const orig = window.open;
    window.open = () => null;
    return () => { window.open = orig; };
  }, []);



  const handleSourceChange = (newIndex) => {
    setCurrentSourceIndex(newIndex);
  };

  const handleIframeLoad = () => setIsLoading(false);

  const handleIframeError = useCallback(() => {
    setAttemptedSources(prev => prev.includes(currentSourceIndex) ? prev : [...prev, currentSourceIndex]);
    setIsLoading(false);
  }, [currentSourceIndex]);

  if (!validSources.length) {
    return (
      <div className="video-player-error min-h-[400px] flex flex-col items-center justify-center bg-[#1a1515] rounded-[25px]">
        <AlertCircle size={48} className="mb-4 text-[#850203]" />
        <h3 className="text-white text-xl font-semibold">No Video Sources</h3>
        <p className="text-white/50 text-sm">No valid video sources available for this title.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col rounded-lg overflow-hidden bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/10 group transition-all duration-500 hover:shadow-[0_0_60px_rgba(229,9,20,0.15)] ring-1 ring-white/5">

      {/* Player Container */}
      <div className="relative w-full aspect-video bg-[#050505] overflow-hidden z-10">
        {/* Loading State - scaled for mobile */}
        <div className={`absolute inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="relative mb-4 sm:mb-8">
            <div className="w-14 h-14 sm:w-20 sm:h-20 border-[3px] sm:border-4 border-white/5 rounded-full"></div>
            <div className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 border-[3px] sm:border-4 border-transparent border-t-[#e50914] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="text-[#e50914] fill-[#e50914] ml-0.5 opacity-50" size={16} />
            </div>
          </div>
          <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] font-medium">Fetching, one moment...</p>
        </div>

        {/* Video Render */}
        <div className={`w-full h-full transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'} transform-gpu`}>
          {currentSource && (
            <iframe
              ref={iframeRef}
              src={currentSource.url}
              title={`${title} - ${currentSource.name}`}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="w-full h-full border-none pointer-events-auto bg-black"
            />
          )}
        </div>
      </div>

      {/* Server Selector Bar - Below Player */}
      <div className="relative z-50 flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#0d0b0b] border-t border-white/5">
        {/* Server icon */}
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#e50914]/8 flex items-center justify-center border border-[#e50914]/15 shrink-0">
          <Server size={13} className="text-[#e50914] sm:w-4 sm:h-4" />
        </div>

        {/* Source pills - horizontal scroll */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {validSources.map((source, idx) => {
            const isSelected = idx === currentSourceIndex;
            const hasFailed = attemptedSources.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleSourceChange(idx)}
                className={`relative whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-300 shrink-0 ${isSelected
                  ? 'bg-[#e50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.3)]'
                  : hasFailed
                    ? 'bg-white/5 text-white/25 line-through'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 active:scale-95'
                }`}
              >
                {source.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;