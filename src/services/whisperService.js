import { pipeline } from '@huggingface/transformers';

let transcriber = null;

/**
 * Initialize the Whisper model. Downloads ~77MB on first use, then cached.
 * @param {function} onProgress - Callback for download progress updates
 */
export const loadWhisperModel = async (onProgress) => {
  if (transcriber) return transcriber;

  transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny',
    {
      dtype: 'fp32',
      device: 'wasm',
      progress_callback: (progress) => {
        if (onProgress && progress.status === 'progress') {
          onProgress({
            file: progress.file,
            loaded: progress.loaded,
            total: progress.total,
            percent: Math.round((progress.loaded / progress.total) * 100),
          });
        }
        if (onProgress && progress.status === 'ready') {
          onProgress({ percent: 100, ready: true });
        }
      },
    }
  );

  return transcriber;
};

/**
 * Transcribe an audio/video file using Whisper (runs in-browser via WASM).
 * @param {string} audioUrl - Object URL of the uploaded media file
 * @param {function} onProgress - Progress callback for model loading
 * @returns {Array} Array of subtitle segments with id, startTime, endTime, text
 */
export const transcribeAudio = async (audioUrl, onProgress) => {
  // Step 1: Load model (cached after first time)
  if (onProgress) onProgress({ percent: 0, status: 'Loading Whisper AI model...' });
  const pipe = await loadWhisperModel(onProgress);

  // Step 2: Transcribe with timestamps
  if (onProgress) onProgress({ percent: 100, status: 'Transcribing audio... This may take a moment.' });

  const result = await pipe(audioUrl, {
    return_timestamps: 'word',
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'english',
    task: 'transcribe',
  });

  // Step 3: Convert Whisper word chunks into our subtitle format
  if (!result.chunks || result.chunks.length === 0) {
    return [{
      id: 1,
      startTime: 0,
      endTime: 0,
      text: result.text || 'No speech detected.',
      words: []
    }];
  }

  // Group words into segments (lines of ~8 words or split by punctuation)
  const subtitles = [];
  let currentSegment = { id: 1, startTime: 0, endTime: 0, text: '', words: [] };
  let wordCount = 0;

  result.chunks.forEach((chunk, index) => {
    // Some words might not have timestamps from Whisper, interpolate or use 0
    const start = chunk.timestamp[0] ?? currentSegment.endTime;
    const end = chunk.timestamp[1] ?? start + 0.5;
    
    if (currentSegment.words.length === 0) {
      currentSegment.startTime = start;
    }
    
    currentSegment.endTime = end;
    currentSegment.words.push({
      text: chunk.text,
      startTime: start,
      endTime: end
    });
    
    currentSegment.text += chunk.text;
    wordCount++;

    const hasPunctuation = /[.!?]/.test(chunk.text);
    
    // Break into new segment after punctuation or > 8 words
    if (hasPunctuation || wordCount >= 8 || index === result.chunks.length - 1) {
      currentSegment.text = currentSegment.text.trim();
      subtitles.push({ ...currentSegment });
      currentSegment = { id: subtitles.length + 1, startTime: end, endTime: end, text: '', words: [] };
      wordCount = 0;
    }
  });

  return subtitles;
};


