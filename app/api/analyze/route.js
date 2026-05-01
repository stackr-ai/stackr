import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { imageB64, imageMime, settings = {}, fileCount = 1 } = await request.json()

    if (!imageB64 || !imageMime) {
      return Response.json({ error: 'Missing image data' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY missing in Vercel environment variables' }, { status: 500 })
    }

    const { standard = 'ANSI', method = 'AUTO', units = 'mm' } = settings

    const methodInstruction = method === 'AUTO'
      ? 'Select the best method automatically: WORST CASE for ≤3 contributors or safety-critical, RSS for ≥4 independent contributors, VECTOR for angular/rotational contributors.'
      : `The user has selected ${method} method — use this method for the analysis.`

    const PROMPT = `You are an expert mechanical engineer specializing in GD&T and tolerance stackup analysis.
Standard: ${standard === 'ISO' ? 'ISO 2768' : 'ASME Y14.5'}. Units: ${units}. Files analyzed: ${fileCount}.

${methodInstruction}

Analyze this engineering drawing and return ONLY raw JSON (no markdown, no backticks):

{
  "method": "RSS" | "WORST CASE" | "VECTOR",
  "methodRationale": "explanation of method choice",
  "assemblySummary": "1-2 sentence description of the assembly",
  "standard": "${standard}",
  "units": "${units}",
  "dimensions": [
    {
      "feature": "feature name",
      "nominal": 0,
      "upperTol": 0,
      "lowerTol": 0,
      "condition": "MMC" | "LMC" | "RFS" | null,
      "gdtControl": "description or null",
      "suggestedChange": "e.g. Tighten to ±0.05mm to eliminate interference — or null if no change needed"
    }
  ],
  "gdtControls": [
    { "type": "flatness|perpendicularity|parallelism|cylindricity|position|runout|concentricity|angularity|straightness|circularity", "value": 0, "feature": "name" }
  ],
  "stackupChain": ["feature1", "feature2"],
  "annotations": [
    {
      "index": 1,
      "x": 45,
      "y": 30,
      "feature": "Housing bore diameter",
      "description": "Tighten upper tolerance from +0.05 to +0.02mm",
      "type": "critical" | "suggestion",
      "side": "right"
    }
  ],
  "result": {
    "nominal": 0,
    "gapMin": 0,
    "gapMax": 0,
    "totalWCTolerance": 0,
    "totalRSSTolerance": 0,
    "sigma": 0,
    "recommendations": ["rec1", "rec2"]
  }
}

ANNOTATIONS: For each dimension that needs a change, add an annotation with x/y as percentage positions (0-100) on the image where the dimension callout is located. Use type "critical" for interference risks, "suggestion" for improvements. Estimate positions from visible drawing features.

Return valid JSON only.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent([
      { inlineData: { data: imageB64, mimeType: imageMime } },
      PROMPT,
    ])

    const raw = result.response.text()
    const clean = raw.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return Response.json(parsed)
  } catch (err) {
    console.error('Stackr error:', err)
    if (err instanceof SyntaxError) {
      return Response.json({ error: 'Could not parse drawing. Try a clearer image.' }, { status: 422 })
    }
    return Response.json({ error: err.message || 'Analysis failed.' }, { status: 500 })
  }
}
