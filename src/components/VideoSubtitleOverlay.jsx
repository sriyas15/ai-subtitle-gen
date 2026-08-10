import React from 'react';

const hexToRgba = (hex, opacity) => {
  if (!hex) return `rgba(0, 0, 0, ${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const VideoSubtitleOverlay = ({ subtitles, currentTime, styleConfig }) => {
  if (!subtitles || subtitles.length === 0) return null;

  // Find the active segment
  let activeSegment = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  // If no active segment is found at the current time, show a dummy preview segment
  // so the user can always see their style changes live!
  if (!activeSegment) {
    activeSegment = {
      text: "Preview Subtitle",
      words: [
        { text: "Preview", startTime: currentTime - 1, endTime: currentTime + 1 },
        { text: "Subtitle", startTime: currentTime + 1, endTime: currentTime + 2 }
      ]
    };
  }

  const bgStyle = styleConfig ? {
    backgroundColor: hexToRgba(styleConfig.backgroundColor, styleConfig.backgroundOpacity),
  } : {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  };

  const textStyle = styleConfig ? {
    fontFamily: styleConfig.fontFamily,
    fontSize: `${styleConfig.fontSize * 0.4}px`, // Roughly map ASS size to pixels
  } : {};

  // Position
  let positionClass = "bottom-8";
  if (styleConfig) {
    if (styleConfig.alignment === 8) positionClass = "top-8";
    if (styleConfig.alignment === 5) positionClass = "top-1/2 -translate-y-1/2";
    if (styleConfig.alignment === 2) positionClass = "bottom-8"; // We could use marginBottom here but tailwind works well for preview
  }

  return (
    <div className={`absolute ${positionClass} left-0 right-0 flex justify-center pointer-events-none px-4 z-10`}>
      <div 
        className="backdrop-blur-sm px-6 py-3 rounded-lg max-w-[90%] text-center shadow-lg"
        style={bgStyle}
      >
        <p 
          className="font-bold leading-relaxed tracking-wide drop-shadow-md"
          style={textStyle}
        >
          {activeSegment.words && activeSegment.words.length > 0 ? (
            activeSegment.words.map((word, idx) => {
              const isCurrent = currentTime >= word.startTime && currentTime <= word.endTime;
              
              // Match the ASS export logic: active word gets highlight color, all others get font color.
              let color = styleConfig ? styleConfig.fontColor : '#ffffff';
              if (isCurrent) {
                color = styleConfig ? styleConfig.highlightColor : '#facc15';
              }

              return (
                <span
                  key={idx}
                  className="transition-colors duration-100"
                  style={{ color }}
                >
                  {word.text}{' '}
                </span>
              );
            })
          ) : (
            <span style={{ color: styleConfig ? styleConfig.fontColor : '#ffffff' }}>
              {activeSegment.text}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default VideoSubtitleOverlay;
