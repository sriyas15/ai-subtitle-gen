/**
 * Converts a hex color (e.g., #FF0000 or #F00) to ASS format (&HAABBGGRR)
 * ASS colors are in Blue-Green-Red order, in hexadecimal.
 */
function hexToAssColor(hex, alpha = '00') {
  if (!hex) return `&H${alpha}FFFFFF`;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) {
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H${alpha}${b}${g}${r}`;
  }
  return `&H${alpha}FFFFFF`;
}

/**
 * Gets ASS inline color tag format (&HBBGGRR&) without alpha.
 */
function hexToInlineAssColor(hex) {
  if (!hex) return `&HFFFFFF&`;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) {
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H${b}${g}${r}&`;
  }
  return `&HFFFFFF&`;
}

function formatAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export function generateAssFile(subtitles, styleConfig, videoWidth = 1080, videoHeight = 1920) {
  const {
    fontFamily = 'Arial',
    fontSize = 80,
    fontColor = '#FFFFFF',
    highlightColor = '#FFFF00',
    backgroundColor = '#000000',
    backgroundOpacity = 0,
    alignment = 2,
    marginBottom = 150,
  } = styleConfig;

  const playResX = videoWidth;
  const playResY = videoHeight;
  
  const primaryColorStyle = hexToAssColor(fontColor);
  
  // Inline tags for colors
  const primaryColorInline = hexToInlineAssColor(fontColor);
  const activeColorInline = hexToInlineAssColor(highlightColor);
  
  // Outline / Background
  const hasBackground = backgroundOpacity > 0;
  const borderStyle = hasBackground ? 3 : 1; // 3 = Opaque Box, 1 = Outline
  const outlineSize = hasBackground ? 10 : 3; // For BorderStyle 3, Outline acts as padding
  
  // Calculate alpha for the background/outline (ASS alpha is inverted: 00=opaque, FF=transparent)
  const alphaHex = Math.round((1 - backgroundOpacity) * 255).toString(16).padStart(2, '0').toUpperCase();
  const backColorStyle = hexToAssColor(backgroundColor, alphaHex);
  
  // For BorderStyle=3, OutlineColour sets the background box's border. We want it to match the box perfectly.
  // If no background (BorderStyle=1), OutlineColour is the text stroke (Black).
  const outlineColorStyle = hasBackground ? backColorStyle : '&H00000000';

  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${primaryColorStyle},${primaryColorStyle},${outlineColorStyle},${outlineColorStyle},-1,0,0,0,100,100,0,0,${borderStyle},${outlineSize},0,${alignment},20,20,${marginBottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Construct the ultimate inline override tag to force libass to respect colors and alpha
  const backColorInline = hexToInlineAssColor(backgroundColor);
  const outlineColorInline = hasBackground ? backColorInline : '&H000000&';
  
  // \c = Primary color, \3c = Outline color, \4c = Background color
  // \1a = Primary alpha, \3a = Outline alpha, \4a = Background alpha
  const globalInlineTags = `{\\c${primaryColorInline}\\3c${outlineColorInline}\\4c${outlineColorInline}\\3a&H${hasBackground ? alphaHex : 'FF'}&\\4a&H${hasBackground ? alphaHex : 'FF'}&}`;

  for (const segment of subtitles) {
    const startAss = formatAssTime(segment.startTime);
    const endAss = formatAssTime(segment.endTime);

    if (!segment.words || segment.words.length === 0) {
      ass += `Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${globalInlineTags}${segment.text}\n`;
      continue;
    }

    for (let i = 0; i < segment.words.length; i++) {
      const activeWord = segment.words[i];
      const wordStart = formatAssTime(activeWord.startTime);
      const wordEnd = formatAssTime(activeWord.endTime);
      
      let lineText = '';
      for (let j = 0; j < segment.words.length; j++) {
        const w = segment.words[j];
        if (j === i) {
          lineText += `{\\c${activeColorInline}}${w.text}{\\c${primaryColorInline}} `;
        } else {
          lineText += `${w.text} `;
        }
      }
      
      ass += `Dialogue: 0,${wordStart},${wordEnd},Default,,0,0,0,,${globalInlineTags}${lineText.trim()}\n`;
    }
  }

  return ass;
}
