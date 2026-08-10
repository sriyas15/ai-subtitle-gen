import React, { useEffect, useRef } from 'react';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00:00';
  const date = new Date(seconds * 1000);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const SubtitleTimeline = ({ subtitles, currentTime, onSeek }) => {
  const containerRef = useRef(null);
  const activeItemRef = useRef(null);

  // Auto-scroll to active item
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]);

  if (!subtitles || subtitles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-t border-gray-800 p-8 text-gray-500">
        No subtitles generated yet.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" ref={containerRef}>
      {subtitles.map((sub) => {
        const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
        return (
          <button
            key={sub.id}
            ref={isActive ? activeItemRef : null}
            onClick={() => onSeek(sub.startTime)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-300 ease-in-out border-l-4 outline-none focus:ring-2 focus:ring-blue-500 ${
              isActive 
                ? 'border-[var(--color-accent)] bg-blue-900/30' 
                : 'border-transparent hover:bg-gray-800/50 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="text-xs text-gray-400 mb-1 font-mono">
              {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
            </div>
            <div className={`text-base ${isActive ? 'text-white' : 'text-gray-300'}`}>
              {sub.text}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SubtitleTimeline;
