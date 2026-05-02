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

    const PROMPT = `You are an expert mechanical engineer. Analyze this engineering drawing for tolerance stackup.

CRITICAL: Your entire response must be ONE valid JSON object. Start your response with { and end with }. No text before or after. No markdown. No explanation. Just raw JSON.

Use this exact structure:
{"method":"WORST CASE","methodRationale":"string","assemblySummary":"string","standard":"${standard}","units":"${units}","dimensions":[{"feature":"string","nominal":0.0,"upperTol":0.0,"lowerTol":0.0,"condition":"MMC","gdtControl":"string","suggestedChange":"string"}],"gdtControls":[{"type":"position","value":0.0,"feature":"string"}],"stackupChain":["string"],"annotations":[{"index":1,"x":50,"y":50,"feature":"string","description":"string","type":"critical","side":"right"}],"result":{"nominal":0.0,"gapMin":0.0,"gapMax":0.0,"totalWCTolerance":0.0,"totalRSSTolerance":0.0,"sigma":3.0,"recommendations":["string"]}}

From this drawing I can see:
- 2X holes φ3±0.5 (Holes #1 and #2) with position tolerance φ0.4 MMC applying to datums A B C
- 2X holes φ5.5±0.5 (Holes #3 and #4) with position tolerance φ0 MMC applying to datums D E F  
- Dimension 125 between features
- Dimension 260 overall
- MIN GAP requirement shown

Standard: ${standard === 'ISO' ? 'ISO 2768' : 'ASME Y14.5'}. Units: ${units}.
${methodInstruction}

Respond with ONLY the JSON object.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: imageMime, data: imageB64 } },
                { text: PROMPT }
              ]
            }
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      if (errText.includes('429') || errText.includes('quota')) {
        return Response.json({ error: 'Quota exceeded. Try on a different network or wait until midnight Pacific time.' }, { status: 429 })
      }
      return Response.json({ error: 'AI API error: ' + errText.slice(0, 200) }, { status: 500 })
    }

    const data = await response.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const clean = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1) {
      return Response.json({ error: 'AI did not return valid JSON. Raw response: ' + clean.slice(0, 200) }, { status: 422 })
    }

    const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1))
    return Response.json(parsed)

  } catch (err) {
    console.error('Stackr error:', err)
    return Response.json({ error: err.message || 'Analysis failed.' }, { status: 500 })
  }
}
