const MODEL = 'claude-sonnet-4-6';
const API_BASE_URL = '/anthropic-api'; // Proxied through Vite dev server

// Direct fetch call to Anthropic API via proxy
const callClaude = async (apiKey, system, messages, maxTokens = 4096) => {
  const response = await fetch(`${API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed?.error?.message || errorBody;
    } catch {
      errorMessage = errorBody;
    }
    throw new Error(`API ${response.status}: ${errorMessage}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

// Test API connectivity with a minimal request
export const testApiKey = async (apiKey) => {
  try {
    const responseText = await callClaude(
      apiKey,
      'Reply with exactly: OK',
      [{ role: 'user', content: 'Test' }],
      10
    );
    return { success: true, message: `Connected! Model responded: "${responseText}"` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Shared parsing logic
const parseJSONResponse = (text) => {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid response format: Expected non-empty JSON array');
    }

    return parsed;
  } catch (err) {
    console.error('Raw response:', text);
    throw new Error('Failed to parse Claude response into subtitles: ' + err.message);
  }
};

export const generateSubtitles = async (apiKey, fileInfo) => {
  // Check file size - base64 is ~33% larger than binary
  const base64SizeMB = (fileInfo.base64.length * 0.75) / (1024 * 1024);
  console.log(`File: ${fileInfo.name}, Size: ${base64SizeMB.toFixed(1)}MB, Type: ${fileInfo.type}`);

  if (base64SizeMB > 25) {
    throw new Error(
      `File is too large (${base64SizeMB.toFixed(1)}MB). Claude supports up to ~25MB per request. Please use a shorter or smaller file.`
    );
  }

  const systemPrompt = `You are a professional audio transcription engine. Analyze the provided audio/video and return ONLY a JSON array of subtitle segments. Each object must have: id (integer, 1-indexed), startTime (float, seconds), endTime (float, seconds), text (string). Return NO other text, explanation, or markdown. Segments must be chronologically ordered and non-overlapping.`;

  const content = [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: fileInfo.type,
        data: fileInfo.base64,
      }
    },
    {
      type: "text",
      text: "Transcribe this media file into time-coded subtitle segments. Return only the JSON array."
    }
  ];

  try {
    const responseText = await callClaude(apiKey, systemPrompt, [{ role: 'user', content }], 4096);
    return parseJSONResponse(responseText);
  } catch (error) {
    // Re-throw with more context
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        'Network error: Could not reach the API. This usually means the file is too large for the browser to handle. Try a smaller file (under 10MB).'
      );
    }
    throw new Error(`API Error: ${error.message}`);
  }
};

export const translateSubtitles = async (apiKey, subtitles, targetLanguage) => {
  const systemPrompt = `You are a professional subtitle translator. You will receive a JSON array of subtitle segments with id and text fields. Translate all text values to ${targetLanguage}. Return ONLY the JSON array with the same ids and translated text. Preserve tone, meaning, and natural phrasing. Return NO other text or markdown.`;

  const payloadToTranslate = subtitles.map(sub => ({
    id: sub.id,
    text: sub.text
  }));

  const messages = [
    {
      role: 'user',
      content: `Translate these subtitle segments: ${JSON.stringify(payloadToTranslate)}`
    }
  ];

  try {
    const responseText = await callClaude(apiKey, systemPrompt, messages, 2048);

    const cleanJSON = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const translatedParsed = JSON.parse(cleanJSON);

    if (!Array.isArray(translatedParsed)) throw new Error("Expected array back");

    const translatedSubtitles = subtitles.map(originalSub => {
      const translatedSub = translatedParsed.find(t => t.id === originalSub.id);
      return {
        ...originalSub,
        text: translatedSub ? translatedSub.text : originalSub.text
      };
    });

    return translatedSubtitles;
  } catch (error) {
    throw new Error(`Translation API Error: ${error.message}`);
  }
};
