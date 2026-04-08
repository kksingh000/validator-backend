const apiKey = process.env.GEMINI_API_KEY || null;

// Direct REST API approach — no SDK dependency, works reliably everywhere
async function generateContent({ model, contents, config = {} }) {
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: contents }] }],
    generationConfig: {},
  };

  if (config.responseMimeType) body.generationConfig.responseMimeType = config.responseMimeType;
  if (config.temperature !== undefined) body.generationConfig.temperature = config.temperature;
  if (config.topP !== undefined) body.generationConfig.topP = config.topP;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API error: ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  return { text };
}

module.exports = apiKey ? { generateContent } : null;
