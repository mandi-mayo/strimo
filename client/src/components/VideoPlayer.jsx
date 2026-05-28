import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, Server, ChevronDown, Settings, Languages, Play } from 'lucide-react';
import CinematicPlayer from './CinematicPlayer';
import api from '../api';

/**
 * VideoPlayer - Advanced streaming player with Cinematic UI
 * Supports subtitle sync, multi-tracks, and high-performance streaming
 */
const VideoPlayer = ({ sources = [], title = 'Video', mediaInfo = {}, debug = false }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [attemptedSources, setAttemptedSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [resolvedStream, setResolvedStream] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [useCinematic, setUseCinematic] = useState(false);

  const iframeRef = useRef(null);
  const dropdownRef = useRef(null);

  const validSources = sources.filter(s => s?.url && typeof s.url === 'string');
  const currentSource = validSources[currentSourceIndex];

  // Attempt to resolve direct stream for VidLink only
  useEffect(() => {
    const resolveSource = async () => {
      if (!currentSource) return;

      setIsLoading(true);
      setResolvedStream(null);
      setSubtitles([]);
      setUseCinematic(false);

      if (currentSource.name.includes('VidLink')) {
        try {
          const { id, type, season, episode } = mediaInfo;
          const res = await api.get(`/resolve/vidlink?id=${id}&type=${type}&season=${season}&episode=${episode}`);

          if (res.data && res.data.stream) {
            setResolvedStream(res.data.stream);
            if (res.data.subtitles) {
              setSubtitles(res.data.subtitles.map(s => ({
                label: s.label,
                url: s.url,
                lang: s.lang
              })));
            }
            setUseCinematic(true);
          }
        } catch (error) {
          if (debug) console.error('[VideoPlayer] Failed to resolve VidLink stream, falling back to iframe');
          setUseCinematic(false);
        }
      } else {
        setUseCinematic(false);
      }

      setIsLoading(false);
    };

    resolveSource();
  }, [currentSourceIndex, mediaInfo, currentSource, debug]);

  // Build proxied URL — routes embed through server which strips ad/redirect scripts
  const proxiedUrl = useCallback((url) => {
    if (!url) return url;
    return `/api/proxy/embed?url=${encodeURIComponent(url)}`;
  }, []);

  // Last-resort: kill window.open on the parent frame too
  useEffect(() => {
    const orig = window.open;
    window.open = () => null;
    return () => { window.open = orig; };
  }, []);

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
    setCurrentSourceIndex(newIndex);
    setIsDropdownOpen(false);
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
    <div className="relative w-full flex flex-col rounded-[2rem] overflow-hidden bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/10 group transition-all duration-500 hover:shadow-[0_0_60px_rgba(229,9,20,0.15)] ring-1 ring-white/5">

      {/* Sleek Glassmorphic Header */}
      <div className="relative z-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-8 py-4 sm:py-5 bg-gradient-to-b from-[#110e0e] to-black/95 border-b border-white/5">

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#e50914]/10 flex items-center justify-center border border-[#e50914]/20 shadow-[0_0_15px_rgba(229,9,20,0.2)]">
            <Server size={18} className="text-[#e50914]" />
          </div>
          <div className="flex flex-col">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 text-white hover:text-[#e50914] transition-colors group/btn"
              >
                <span className="font-semibold text-sm sm:text-base tracking-wide">{currentSource?.name}</span>
                <ChevronDown size={16} className={`transition-transform duration-500 text-white/40 group-hover/btn:text-[#e50914] ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Cinematic Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-[#141111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto hide-scrollbar">
                    {validSources.map((source, idx) => {
                      const isSelected = idx === currentSourceIndex;
                      const hasFailed = attemptedSources.includes(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSourceChange(idx)}
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 ${isSelected
                            ? 'bg-[#e50914] text-white font-bold shadow-lg shadow-[#e50914]/30'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />}
                            <span className="truncate">{source.name}</span>
                          </div>
                          {hasFailed && (
                            <span className="text-[9px] text-red-100 uppercase font-black bg-black/40 px-2 py-0.5 rounded-md border border-white/10">Failed</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Player Container */}
      <div className="relative w-full aspect-video bg-[#050505] overflow-hidden z-10">
        {/* Animated Cinematic Loading State */}
        <div className={`absolute inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-white/5 rounded-full shadow-[0_0_30px_rgba(229,9,20,0.1)]"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[#e50914] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="text-[#e50914] fill-[#e50914] ml-1 opacity-50" size={24} />
            </div>
          </div>
          <h3 className="text-white text-lg font-medium tracking-wide mb-2 animate-pulse">Initializing Stream</h3>
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] font-medium">Connecting to {currentSource?.name}</p>
        </div>

        {/* Video Render */}
        <div className={`w-full h-full transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'} transform-gpu`}>
          {useCinematic && resolvedStream ? (
            <CinematicPlayer
              url={resolvedStream}
              subtitles={subtitles}
              title={title}
              onReady={() => setIsLoading(false)}
            />
          ) : (
            currentSource && (
              <iframe
                ref={iframeRef}
                src={proxiedUrl(currentSource.url)}
                title={`${title} - ${currentSource.name}`}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="w-full h-full border-none pointer-events-auto bg-black"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;