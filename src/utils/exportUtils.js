const formatSRTTime = (seconds) => {
  const date = new Date(seconds * 1000);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
};

const formatVTTTime = (seconds) => {
  const date = new Date(seconds * 1000);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

export const generateSRT = (subtitles) => {
  let srtContent = '';
  subtitles.forEach((sub, index) => {
    srtContent += `${index + 1}\n`;
    srtContent += `${formatSRTTime(sub.startTime)} --> ${formatSRTTime(sub.endTime)}\n`;
    srtContent += `${sub.text}\n\n`;
  });
  return srtContent.trim();
};

export const generateVTT = (subtitles) => {
  let vttContent = 'WEBVTT\n\n';
  subtitles.forEach((sub, index) => {
    vttContent += `${index + 1}\n`;
    vttContent += `${formatVTTTime(sub.startTime)} --> ${formatVTTTime(sub.endTime)}\n`;
    vttContent += `${sub.text}\n\n`;
  });
  return vttContent.trim();
};

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getExportFilename = (originalName, ext) => {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (originalName) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    return `${baseName}.${ext}`;
  }
  return `subtitles_${dateStr}.${ext}`;
};
