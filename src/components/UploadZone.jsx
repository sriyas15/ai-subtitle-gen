import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, FileAudio, FileVideo } from 'lucide-react';

const SUPPORTED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];
const SUPPORTED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];

const UploadZone = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    setError(null);
    if (!file) return;

    if (!SUPPORTED_AUDIO.includes(file.type) && !SUPPORTED_VIDEO.includes(file.type)) {
      setError(`Unsupported file type: ${file.type || 'unknown'}. Please upload MP3, WAV, M4A, AAC, MP4, WebM, or MOV.`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      console.warn('File is larger than 100MB. This might cause memory issues.');
      // Proceeding with a warning as per SRS
    }

    const isVideo = file.type.startsWith('video');
    const objectUrl = URL.createObjectURL(file);
    
    // We also need base64 for the API
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      onUpload({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        isVideo,
        objectUrl,
        base64
      });
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-[var(--color-accent)] bg-blue-900/20' : 'border-gray-600 hover:border-gray-400 bg-[#1E293B]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Drag and drop your media file</h3>
        <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
          Supports MP3, WAV, M4A, AAC, MP4, WebM, MOV. Up to 100MB recommended.
        </p>
        <button className="px-4 py-2 bg-[var(--color-surface)] border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors">
          Browse Files
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*,video/mp4,video/webm,video/quicktime"
          onChange={handleChange}
        />
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadZone;
