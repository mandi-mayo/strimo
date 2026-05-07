import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, Server, ChevronDown, Settings, Clock, Languages } from 'lucide-react';
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

  // Attempt to resolve direct stream for VidLink
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
          if (debug) console.error('[VideoPlayer] Failed to resolve Cinematic stream, falling back to iframe');
          setUseCinematic(false);
        }
      } else {
        setUseCinematic(false);
      }
      
      setIsLoading(false);
    };

    resolveSource();
  }, [currentSourceIndex, mediaInfo, currentSource, debug]);

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
    <div className="video-player-wrapper flex flex-col rounded-[25px] overflow-hidden shadow-2xl bg-[#1a1515] border border-white/5 group">
      {/* Header / Server Selector */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-6 py-4 bg-[#292323]/95 backdrop-blur-xl border-b border-white/5 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#850203]/10 rounded-lg">
            <Server size={18} className="text-[#850203]" />
          </div>
          <span className="text-white/60 text-sm font-medium hidden sm:inline">Source:</span>
        </div>
        
        <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full sm:min-w-[200px] gap-4 px-4 py-2.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl text-white transition-all duration-300 group/btn"
          >
            <span className="font-semibold truncate text-sm">{currentSource?.name}</span>
            <div className="flex items-center gap-2">
              {attemptedSources.includes(currentSourceIndex) && (
                <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">Failed</span>
              )}
              <ChevronDown size={16} className={`shrink-0 transition-transform duration-500 text-white/40 group-hover/btn:text-white ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-[#292323] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-2 flex flex-col gap-1 max-h-[350px] overflow-y-auto hide-scrollbar">
                <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Available Servers</div>
                {validSources.map((source, idx) => {
                  const isSelected = idx === currentSourceIndex;
                  const hasFailed = attemptedSources.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSourceChange(idx)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#850203] text-white font-semibold shadow-lg shadow-[#850203]/20' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-white/20'}`} />
                        <span className="truncate">{source.name}</span>
                      </div>
                      {hasFailed && (
                        <span className="text-[9px] text-red-300 uppercase font-black bg-red-500/20 px-1.5 py-0.5 rounded">Offline</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Info Tags */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <Clock size={12} className="text-white/40" />
            <span className="text-[11px] text-white/60 font-medium">Auto-Sync Enabled</span>
          </div>
          {useCinematic && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#850203]/20 rounded-full border border-[#850203]/30">
              <Languages size={12} className="text-[#850203]" />
              <span className="text-[11px] text-white font-semibold uppercase tracking-wider">Cinematic Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Player Main Area */}
      <div className="w-full aspect-video relative overflow-hidden bg-[#0a0a0a]">
        {isLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/5 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-t-[#850203] rounded-full absolute top-0 left-0 animate-spin"></div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-white font-medium tracking-wide">Initializing Secure Stream</p>
              <p className="text-white/30 text-[11px] uppercase tracking-[0.2em]">Connecting to {currentSource?.name}</p>
            </div>
          </div>
        )}

        <div className={`w-full h-full transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
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
                src={currentSource.url}
                title={`${title} - ${currentSource.name}`}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="w-full h-full border-none"
              />
            )
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-[#1a1515] flex items-center justify-end border-t border-white/5">
        <div className="text-[11px] text-white/20 font-mono">
          REF: {currentSource?.name.replace(/[^A-Z0-9]/gi, '').substring(0, 8).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
