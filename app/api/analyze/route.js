export async function POST(request) {
  try {
    const { imageB64, imageMime, settings = {}, fileCount = 1 } = await request.json()

    if (!imageB64 || !imageMime) {
      return Response.json({ error: 'Missing file data' }, { status: 400 })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: 'OPENROUTER_API_KEY missing in Vercel environment variables' }, { status: 500 })
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stackr-ai.vercel.app',
        'X-Title': 'Stackr Tolerance Analyzer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${imageMime};base64,${imageB64}` }
              },
              {
                type: 'text',
                text: PROMPT
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', errText)
      return Response.json({ error: 'AI API error: ' + errText.slice(0, 200) }, { status: 500 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''

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
