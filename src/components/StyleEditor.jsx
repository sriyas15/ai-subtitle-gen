import React, { useState, useRef, useEffect } from 'react';
import { FONT_MAP } from '../services/ffmpegService';

const FONTS = Object.keys(FONT_MAP);

const StyleEditor = ({ styleConfig, setStyleConfig }) => {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (key, value) => {
    setStyleConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to ensure 7-char lowercase hex for the color picker input
  const getSafeHex = (hex) => {
    if (!hex) return '#000000';
    hex = hex.trim().toLowerCase();
    if (hex.length === 4 && hex.startsWith('#')) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (hex.length === 7 && hex.startsWith('#')) {
      return hex;
    }
    return '#000000'; // Fallback if invalid
  };

  return (
    <div className="bg-[#0F172A] border border-gray-800 rounded-lg p-4 flex flex-col gap-4 text-sm">
      <h3 className="text-white font-medium mb-1">Subtitle Style</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Font Family */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-gray-400">Font</label>
          <button
            type="button"
            className="bg-gray-800 text-white border border-gray-700 rounded p-1.5 focus:ring-1 focus:ring-[var(--color-accent)] outline-none text-left flex justify-between items-center"
            style={{ fontFamily: styleConfig.fontFamily }}
            onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
          >
            {styleConfig.fontFamily}
            <span className="text-gray-400 text-xs">▼</span>
          </button>
          
          {isFontDropdownOpen && (
            <div className="absolute top-[100%] left-0 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto z-50">
              {FONTS.map(f => (
                <div
                  key={f}
                  className={`p-2 cursor-pointer hover:bg-gray-700 ${styleConfig.fontFamily === f ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]' : 'text-gray-200'}`}
                  style={{ fontFamily: f }}
                  onClick={() => {
                    handleChange('fontFamily', f);
                    setIsFontDropdownOpen(false);
                  }}
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Font Size (ASS size mapped to 1920 height, let's keep it 40 to 120 range) */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            Size <span>{styleConfig.fontSize}</span>
          </label>
          <input 
            type="range" 
            min="40" 
            max="150" 
            value={styleConfig.fontSize}
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        {/* Text Color */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400" htmlFor="color-font">Text Color</label>
          <div className="flex items-center gap-2">
            <input 
              id="color-font"
              name="color-font"
              type="color" 
              value={getSafeHex(styleConfig.fontColor || '#ffffff')}
              onChange={(e) => handleChange('fontColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
              type="text" 
              value={styleConfig.fontColor} 
              onChange={(e) => handleChange('fontColor', e.target.value)}
              className="bg-gray-800 text-gray-300 uppercase border border-gray-700 rounded px-2 py-1 w-24 focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
            />
          </div>
        </div>

        {/* Highlight Color */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400" htmlFor="color-highlight">Highlight</label>
          <div className="flex items-center gap-2">
            <input 
              id="color-highlight"
              name="color-highlight"
              type="color" 
              value={getSafeHex(styleConfig.highlightColor || '#facc15')}
              onChange={(e) => handleChange('highlightColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
              type="text" 
              value={styleConfig.highlightColor} 
              onChange={(e) => handleChange('highlightColor', e.target.value)}
              className="bg-gray-800 text-gray-300 uppercase border border-gray-700 rounded px-2 py-1 w-24 focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400" htmlFor="color-bg">Background</label>
          <div className="flex items-center gap-2">
            <input 
              id="color-bg"
              name="color-bg"
              type="color" 
              value={getSafeHex(styleConfig.backgroundColor || '#000000')}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
              type="text" 
              value={styleConfig.backgroundColor} 
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="bg-gray-800 text-gray-300 uppercase border border-gray-700 rounded px-2 py-1 w-24 focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
            />
          </div>
        </div>

        {/* Background Opacity */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            Opacity <span>{Math.round(styleConfig.backgroundOpacity * 100)}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={styleConfig.backgroundOpacity * 100}
            onChange={(e) => handleChange('backgroundOpacity', parseInt(e.target.value) / 100)}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        {/* Position */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-gray-400">Vertical Position</label>
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button 
              className={`flex-1 py-1 text-center rounded transition-colors ${styleConfig.alignment === 8 ? 'bg-[var(--color-accent)] text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { handleChange('alignment', 8); handleChange('marginBottom', 50); }}
            >
              Top
            </button>
            <button 
              className={`flex-1 py-1 text-center rounded transition-colors ${styleConfig.alignment === 5 ? 'bg-[var(--color-accent)] text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { handleChange('alignment', 5); handleChange('marginBottom', 50); }}
            >
              Middle
            </button>
            <button 
              className={`flex-1 py-1 text-center rounded transition-colors ${styleConfig.alignment === 2 ? 'bg-[var(--color-accent)] text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { handleChange('alignment', 2); handleChange('marginBottom', 50); }}
            >
              Bottom
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default StyleEditor;
