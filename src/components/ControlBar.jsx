import React from 'react';
import { Loader2, Download, Sparkles } from 'lucide-react';

const ControlBar = ({
  hasFile,
  hasSubtitles,
  isGenerating,
  onGenerate,
  onExportSRT,
  onExportVTT,
  onExportVideo,
  isExporting,
  error,
  onRetry,
  progressStatus
}) => {
  return (
    <div className="bg-[var(--color-surface)] border-y border-gray-800 p-4 flex flex-col gap-4">
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex justify-between items-center">
          <span className="text-red-200 text-sm">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white text-sm rounded transition-colors shrink-0 ml-4"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Progress status during generation */}
      {progressStatus && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
          <span className="text-blue-200 text-sm">{progressStatus}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onGenerate}
          disabled={!hasFile || isGenerating}
          className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Subtitles</>
          )}
        </button>

        <div className="flex items-center gap-4 flex-wrap">

          <div className="flex items-center gap-2">
            <button
              onClick={onExportVideo}
              disabled={!hasSubtitles || isGenerating || isExporting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Video
            </button>
            <button
              onClick={onExportSRT}
              disabled={!hasSubtitles || isGenerating || isExporting}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> SRT
            </button>
            <button
              onClick={onExportVTT}
              disabled={!hasSubtitles || isGenerating || isExporting}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> VTT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
