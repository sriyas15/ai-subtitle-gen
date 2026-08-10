import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

let ffmpeg = null;

export const loadFFmpeg = async (onProgress) => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await toBlobURL(coreURL, 'text/javascript'),
    wasmURL: await toBlobURL(wasmURL, 'application/wasm'),
  });

  return ffmpeg;
};

export const FONT_MAP = {
  'Roboto': '/fonts/Roboto.ttf',
  'Open Sans': '/fonts/OpenSans.ttf',
  'Lato': '/fonts/Lato.ttf',
  'Montserrat': '/fonts/Montserrat.ttf',
  'Oswald': '/fonts/Oswald.ttf',
  'Source Sans Pro': '/fonts/SourceSansPro.ttf',
  'Slabo 27px': '/fonts/Slabo27px.ttf',
  'Raleway': '/fonts/Raleway.ttf',
  'PT Sans': '/fonts/PTSans.ttf',
  'Merriweather': '/fonts/Merriweather.ttf',
  'Noto Sans': '/fonts/NotoSans.ttf',
  'Nunito': '/fonts/Nunito.ttf',
  'Concert One': '/fonts/ConcertOne.ttf',
  'Playfair Display': '/fonts/PlayfairDisplay.ttf',
  'Rubik': '/fonts/Rubik.ttf',
  'Lora': '/fonts/Lora.ttf',
  'Work Sans': '/fonts/WorkSans.ttf',
  'Fira Sans': '/fonts/FiraSans.ttf',
  'Quicksand': '/fonts/Quicksand.ttf',
  'Inter': '/fonts/Inter.ttf',
  'Anton': '/fonts/Anton.ttf',
  'Bebas Neue': '/fonts/BebasNeue.ttf',
  'Dancing Script': '/fonts/DancingScript.ttf',
  'Pacifico': '/fonts/Pacifico.ttf',
  'Cinzel': '/fonts/Cinzel.ttf',
};

/**
 * Burns ASS subtitles into a video file using FFmpeg.wasm
 * @param {File|string} videoFile - The video file or blob URL
 * @param {string} assContent - The ASS file content as a string
 * @param {Function} onProgress - Progress callback
 * @param {Object} styleConfig - Style configuration for font fetching
 * @returns {Promise<string>} Blob URL of the rendered video
 */
export const burnSubtitles = async (videoFile, assContent, onProgress, styleConfig = {}) => {
  if (!ffmpeg) {
    if (onProgress) onProgress({ status: 'Loading video engine...' });
    await loadFFmpeg();
  }

  const inputName = 'input.mp4';
  const subName = 'subtitles.ass';
  const outputName = 'output.mp4';

  const fontName = styleConfig.fontFamily || 'Roboto';
  const relativeFontURL = FONT_MAP[fontName] || FONT_MAP['Roboto'];
  const fontURL = new URL(relativeFontURL, window.location.origin).href;

  // Save it as its actual file name so libass matches the TTF headers correctly
  const fontFileName = relativeFontURL.split('/').pop();

  if (onProgress) onProgress({ status: 'Preparing files...' });

  // Fetch and write the selected font to the virtual FS for the ASS filter
  try {
    await ffmpeg.writeFile(fontFileName, await fetchFile(fontURL));
  } catch (e) {
    console.warn(`Failed to load font file: ${fontName}`, e);
  }

  // Write video to virtual FS
  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

  // Write ASS to virtual FS
  const encoder = new TextEncoder();
  await ffmpeg.writeFile(subName, encoder.encode(assContent));

  if (onProgress) onProgress({ status: 'Rendering video... This will take a while.', percent: 0 });

  // Capture FFmpeg logs for debugging
  let logBuffer = '';
  const logCallback = ({ message }) => {
    logBuffer += message + '\n';
  };
  ffmpeg.on('log', logCallback);

  // Capture FFmpeg progress
  const progressCallback = ({ progress, time }) => {
    if (onProgress && typeof progress === 'number') {
      const p = Math.max(0, Math.min(100, Math.round(progress * 100)));
      if (!isNaN(p)) {
        onProgress({ status: 'Rendering video...', percent: p, time });
      }
    }
  };
  ffmpeg.on('progress', progressCallback);

  // Run FFmpeg
  // We use libx264 for high quality, crf 30 for better file sizes, and re-encode audio to AAC.
  // We use the ultrafast preset because WASM execution is slow, and this maximizes speed.
  const retCode = await ffmpeg.exec([
    '-i', inputName,
    '-vf', `ass=${subName}:fontsdir=/`,
    '-c:v', 'libx264',
    '-crf', '30',
    '-preset', 'ultrafast',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName
  ]);

  ffmpeg.off('log', logCallback);
  ffmpeg.off('progress', progressCallback);

  if (retCode !== 0) {
    console.error('FFmpeg Log:', logBuffer);
    // Find the last few lines of the log to show to the user
    const logLines = logBuffer.trim().split('\n');
    const lastError = logLines.slice(-3).join(' | ');
    throw new Error(`FFmpeg Error: ${lastError}`);
  }

  if (onProgress) onProgress({ status: 'Finalizing...', percent: 100 });

  // Read output
  const data = await ffmpeg.readFile(outputName);

  // Cleanup virtual FS
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(subName);
  await ffmpeg.deleteFile(fontFileName);
  await ffmpeg.deleteFile(outputName);

  // Return blob URL
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  return URL.createObjectURL(blob);
};
