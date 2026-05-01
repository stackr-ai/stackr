export const runtime = 'edge'

export async function POST(request) {
  try {
    const { imageB64, imageMime, settings = {}, fileCount = 1 } = await request.json()

    if (!imageB64 || !imageMime) {
      return Response.json({ error: 'Missing file data' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY missing in Vercel environment variables' }, { status: 500 })
    }

    const { standard = 'ANSI', method = 'AUTO', units = 'mm' } = settings

    const methodInstruction = method === 'AUTO'
      ? 'Select the best method: WORST CASE for 3 or fewer contributors or safety-critical, RSS for 4+ independent contributors, VECTOR for angular or rotational contributors.'
      : `User selected ${method} — use this method.`

    const PROMPT = `You are an expert mechanical engineer specializing in GD&T and tolerance stackup analysis.
Standard: ${standard === 'ISO' ? 'ISO 2768' : 'ASME Y14.5'}. Units: ${units}. Files: ${fileCount}.
${methodInstruction}
Analyze this engineering drawing. Return ONLY a raw JSON object. No explanation, no markdown, no code fences, just the JSON starting with { and ending with }.
{
  "method": "RSS",
  "methodRationale": "reason for method choice",
  "assemblySummary": "1-2 sentence description",
  "standard": "${standard}",
  "units": "${units}",
  "dimensions": [
    {
      "feature": "feature name",
      "nominal": 0,
      "upperTol": 0,
      "lowerTol": 0,
      "condition": "MMC",
      "gdtControl": "description or null",
      "suggestedChange": "specific change or null"
    }
  ],
  "gdtControls": [
    { "type": "flatness", "value": 0, "feature": "name" }
  ],
  "stackupChain": ["feature1", "feature2"],
  "annotations": [
    { "index": 1, "x": 50, "y": 30, "feature": "name", "description": "what to change", "type": "critical", "side": "right" }
  ],
  "result": {
    "nominal": 0,
    "gapMin": 0,
    "gapMax": 0,
    "totalWCTolerance": 0,
    "totalRSSTolerance": 0,
    "sigma": 0,
    "recommendations": ["recommendation 1", "recommendation 2"]
  }
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: imageMime, data: imageB64 } },
              { text: PROMPT }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini error:', errText)
      if (errText.includes('429') || errText.includes('quota')) {
        return Response.json({ error: 'Quota exceeded. Create a new API key at aistudio.google.com or wait until midnight Pacific time.' }, { status: 429 })
      }
      return Response.json({ error: 'AI API error: ' + errText.slice(0, 200) }, { status: 500 })
    }

    const data = await response.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const clean = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1) {
      return Response.json({ error: 'AI did not return valid analysis. Try a clearer drawing image.' }, { status: 422 })
    }

    const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1))
    return Response.json(parsed)

  } catch (err) {
    console.error('Stackr error:', err)
    return Response.json({ error: err.message || 'Analysis failed.' }, { status: 500 })
  }
}
