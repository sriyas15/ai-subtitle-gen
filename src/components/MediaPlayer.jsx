import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import VideoSubtitleOverlay from './VideoSubtitleOverlay';

const MediaPlayer = forwardRef(({ mediaUrl, isVideo, onTimeUpdate, subtitles, currentTime, styleConfig }, ref) => {
  const internalRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync internal ref and forwarded ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        ref.current = internalRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (internalRef.current && onTimeUpdate) {
      onTimeUpdate(internalRef.current.currentTime);
    }
  };

  if (!mediaUrl) return null;

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-black flex justify-center items-center relative ${
        isFullscreen ? 'h-screen w-screen' : 'rounded-xl overflow-hidden shadow-lg border border-gray-800 max-h-[400px]'
      }`}
    >
      {isVideo ? (
        <>
          <video 
            ref={internalRef}
            src={mediaUrl} 
            controls 
            className={`w-full object-contain ${isFullscreen ? 'h-full' : 'max-h-[400px]'}`}
            onTimeUpdate={handleTimeUpdate}
          />
          {/* Custom Fullscreen Button */}
          <button 
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-lg text-white transition-all shadow-md"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </>
      ) : (
        <audio 
          ref={internalRef}
          src={mediaUrl} 
          controls 
          className="w-full my-10 px-4"
          onTimeUpdate={handleTimeUpdate}
        />
      )}
      <VideoSubtitleOverlay subtitles={subtitles} currentTime={currentTime} styleConfig={styleConfig} />
    </div>
  );
});

MediaPlayer.displayName = 'MediaPlayer';

export default MediaPlayer;
