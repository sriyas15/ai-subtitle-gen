import React, { useState, useRef } from 'react';
import UploadZone from './components/UploadZone';
import MediaPlayer from './components/MediaPlayer';
import ControlBar from './components/ControlBar';
import SubtitleTimeline from './components/SubtitleTimeline';
import { transcribeAudio } from './services/whisperService';
import { generateSRT, generateVTT, downloadFile, getExportFilename } from './utils/exportUtils';
import { generateAssFile } from './utils/assGenerator';
import { burnSubtitles } from './services/ffmpegService';
import { AudioLines, Cpu, Settings } from 'lucide-react';
import StyleEditor from './components/StyleEditor';

function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [progressStatus, setProgressStatus] = useState(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);

  // Default subtitle styles
  const [styleConfig, setStyleConfig] = useState({
    fontFamily: 'Roboto',
    fontSize: 80,
    fontColor: '#ffffff',
    highlightColor: '#facc15',
    backgroundColor: '#000000',
    backgroundOpacity: 0.6,
    alignment: 2,
    marginBottom: 50
  });

  const mediaRef = useRef(null);

  const handleUpload = (info) => {
    setFileInfo(info);
    setSubtitles([]);
    setError(null);
    setProgressStatus(null);
  };

  const handleGenerate = async () => {
    if (!fileInfo) return;
    setIsGenerating(true);
    setError(null);
    setProgressStatus('Initializing Whisper AI model...');

    try {
      const generated = await transcribeAudio(fileInfo.objectUrl, (progress) => {
        if (progress.status) {
          setProgressStatus(progress.status);
        } else if (progress.percent !== undefined && !progress.ready) {
          setProgressStatus(`Downloading AI model: ${progress.percent}% (${progress.file || ''})`);
        }
      });
      setSubtitles(generated);
      setProgressStatus(null);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio.');
      setProgressStatus(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportSRT = () => {
    const srt = generateSRT(subtitles);
    const filename = getExportFilename(fileInfo?.name, 'srt');
    downloadFile(srt, filename, 'text/srt');
  };

  const handleExportVTT = () => {
    const vtt = generateVTT(subtitles);
    const filename = getExportFilename(fileInfo?.name, 'vtt');
    downloadFile(vtt, filename, 'text/vtt');
  };

  const handleExportVideo = async () => {
    if (!fileInfo || subtitles.length === 0) return;
    
    if (!fileInfo.isVideo) {
      setError("Cannot export video. The uploaded file is an audio file.");
      return;
    }

    setIsExporting(true);
    setError(null);
    setProgressStatus('Preparing video export...');

    try {
      // Get natural dimensions of the video for the ASS file
      let videoWidth = 1080;
      let videoHeight = 1920;
      if (mediaRef.current && mediaRef.current.videoWidth) {
        videoWidth = mediaRef.current.videoWidth;
        videoHeight = mediaRef.current.videoHeight;
      }

      const assContent = generateAssFile(subtitles, styleConfig, videoWidth, videoHeight);

      // Burn subtitles into video
      const objectUrl = await burnSubtitles(fileInfo.file, assContent, (progress) => {
        if (progress.status) {
          setProgressStatus(progress.percent !== undefined ? `${progress.status} ${progress.percent}%` : progress.status);
        } else if (progress.percent !== undefined) {
          setProgressStatus(`Rendering video: ${progress.percent}%`);
        }
      }, styleConfig);

      const filename = getExportFilename(fileInfo?.name, 'mp4', 'subtitled');
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      setProgressStatus(null);
    } catch (err) {
      console.error('Video export error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'Failed to export video.');
      setProgressStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSeek = (time) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      if (mediaRef.current.paused) {
        mediaRef.current.play().catch(e => console.log('Playback prevented', e));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1100px] flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-accent)] rounded-lg flex items-center justify-center">
            <AudioLines className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">AI Subtitle Generator</h1>
            <p className="text-gray-400 text-sm">Powered by Whisper AI — 100% Free & Private</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full">
              <Cpu className="w-3.5 h-3.5" />
              Runs locally in your browser
            </div>
            <button 
              onClick={() => setShowStyleEditor(!showStyleEditor)}
              className={`p-2 rounded-lg transition-colors ${showStyleEditor ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              title="Subtitle Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          
          <div className="flex-1 flex flex-col bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
            {/* Top Section: Upload or Player */}
            <div className="p-6 shrink-0 bg-[#0F172A]/30">
              {!fileInfo ? (
                <UploadZone onUpload={handleUpload} />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-400 px-2">
                    <div className="truncate max-w-[60%]">File: {fileInfo.name}</div>
                    <button 
                      onClick={() => { setFileInfo(null); setSubtitles([]); setProgressStatus(null); }}
                      className="text-[var(--color-accent)] hover:text-blue-400"
                    >
                      Change Media
                    </button>
                  </div>
                  <MediaPlayer 
                    ref={mediaRef}
                    mediaUrl={fileInfo.objectUrl} 
                    isVideo={fileInfo.isVideo}
                    onTimeUpdate={setCurrentTime}
                    subtitles={subtitles}
                    currentTime={currentTime}
                    styleConfig={styleConfig}
                  />
                </div>
              )}
            </div>

            {/* Middle Section: Control Bar */}
            <ControlBar 
              hasFile={!!fileInfo}
              hasSubtitles={subtitles.length > 0}
              isGenerating={isGenerating}
              isExporting={isExporting}
              onGenerate={handleGenerate}
              onExportSRT={handleExportSRT}
              onExportVTT={handleExportVTT}
              onExportVideo={handleExportVideo}
              error={error}
              onRetry={() => setError(null)}
              progressStatus={progressStatus}
            />

            {/* Bottom Section: Timeline */}
            <SubtitleTimeline 
              subtitles={subtitles}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </div>

          {/* Right Section: Style Editor Sidebar */}
          {showStyleEditor && (
            <div className="w-full lg:w-80 shrink-0 overflow-y-auto">
              <StyleEditor 
                styleConfig={styleConfig} 
                setStyleConfig={setStyleConfig} 
              />
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;
