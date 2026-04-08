const gemini = require("../config/gemini");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_DESCRIPTION_CHARS = 1400;

const SYSTEM_PROMPT = `You are an expert startup analyst and venture capital advisor.
Analyze the given startup idea thoroughly and return a structured JSON analysis.
Be specific, realistic, and data-driven. Tailor every field to the actual idea — do NOT use generic placeholders.`;

const SCHEMA_PROMPT = `
Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "problem_summary": "string — 2-3 sentence summary of the specific problem being solved",
  "customer_persona": {
    "name": "string — fictional persona name relevant to the target market",
    "age_range": "string",
    "occupation": "string",
    "pain_points": ["string — 3 specific pain points"],
    "goals": ["string — 2-3 specific goals"],
    "demographics": "string — short demographic overview"
  },
  "market_overview": {
    "market_size": "string — estimated TAM / SAM / SOM with dollar figures",
    "growth_rate": "string — CAGR percentage",
    "trends": ["string — 3 current market trends"],
    "summary": "string — 2-3 sentence market narrative"
  },
  "competitors": [
    {
      "name": "string — real company name",
      "description": "string — what they do",
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  ],
  "suggested_tech_stack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "infrastructure": ["string"],
    "ai_ml": ["string"],
    "rationale": "string — why this stack fits the idea"
  },
  "risk_level": "Low | Medium | High",
  "risk_factors": ["string — 3 specific risk factors"],
  "profitability_score": "integer 0-100",
  "profitability_rationale": "string — 2-3 sentences explaining the score",
  "recommendations": ["string — 4 actionable recommendations"],
  "verdict": "string — one-paragraph final assessment with clear go/no-go signal"
}`;

function trimText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function buildUserPrompt(idea) {
  const description = trimText(idea.description, MAX_DESCRIPTION_CHARS);
  let prompt = `Analyze this startup idea:\n\nTitle: ${idea.title}\nDescription: ${description}`;
  if (idea.industry) prompt += `\nIndustry: ${idea.industry}`;
  if (idea.target_market) prompt += `\nTarget Market: ${idea.target_market}`;
  return prompt;
}

function getMockAnalysis(idea) {
  return {
    problem_summary: `The startup "${idea.title}" aims to address a gap in the ${idea.industry || "technology"} space. ${trimText(idea.description, 200)}`,
    customer_persona: {
      name: "Alex Rivera",
      age_range: "25-40",
      occupation: "Professional / Early Adopter",
      pain_points: [
        "Current solutions are too expensive",
        "Existing tools lack integration",
        "Poor user experience with incumbents",
      ],
      goals: [
        "Save time on repetitive tasks",
        "Find an affordable, reliable solution",
      ],
      demographics: "Urban, tech-savvy, mid-income professionals",
    },
    market_overview: {
      market_size: "$10B+ TAM (estimated)",
      growth_rate: "12-18% CAGR",
      trends: [
        "Growing demand for AI-driven solutions",
        "Shift towards SaaS and subscription models",
        "Increasing remote-work adoption",
      ],
      summary:
        "The market is expanding rapidly with strong tailwinds from digital transformation. Early movers have an opportunity to capture meaningful share.",
    },
    competitors: [
      {
        name: "Competitor A",
        description: "Established player with broad feature set",
        strengths: ["Brand recognition", "Large user base"],
        weaknesses: ["Slow innovation", "High pricing"],
      },
      {
        name: "Competitor B",
        description: "Emerging startup with modern UX",
        strengths: ["Modern design", "Developer-friendly API"],
        weaknesses: ["Limited market share", "Narrow feature set"],
      },
    ],
    suggested_tech_stack: {
      frontend: ["React", "Next.js", "Tailwind CSS"],
      backend: ["Node.js", "Express"],
      database: ["Supabase (PostgreSQL)"],
      infrastructure: ["Vercel", "AWS S3"],
      ai_ml: ["OpenAI GPT-4", "LangChain"],
      rationale:
        "A modern JS stack provides rapid iteration speed and easy hiring. Supabase gives real-time capabilities out of the box.",
    },
    risk_level: "Medium",
    risk_factors: [
      "Competitive market with funded incumbents",
      "Customer acquisition cost may be high",
      "Regulatory uncertainty in some regions",
    ],
    profitability_score: 62,
    profitability_rationale:
      "Moderate profitability potential — strong demand but significant competition. Unit economics look promising if CAC is kept under control.",
    recommendations: [
      "Validate with 50+ customer interviews before building",
      "Start with a narrow niche and expand",
      "Consider a freemium model to drive adoption",
      "Build a strong content-marketing flywheel early",
    ],
    verdict:
      "This idea has promising potential in a growing market. The key risks revolve around competition and customer acquisition. With focused execution, lean validation, and a differentiated value proposition, it could become a viable business. Recommended to proceed with a focused MVP.",
  };
}

async function analyzeIdea(idea) {
  if (!gemini) {
    console.log("ℹ️  Using mock analysis (no Gemini API key configured)");
    return getMockAnalysis(idea);
  }

  console.log(`🤖 Calling Gemini (${MODEL}) for: "${idea.title}"`);

  const prompt = `${SYSTEM_PROMPT}\n\n${SCHEMA_PROMPT}\n\n${buildUserPrompt(idea)}`;

  const response = await gemini.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.45,
      topP: 0.95,
    },
  });

  const raw = response.text;

  if (!raw) {
    throw new Error("Gemini response was empty.");
  }

  try {
    const parsed = JSON.parse(raw);
    console.log(`✅ Gemini analysis complete for: "${idea.title}"`);
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini JSON response:", raw);
    throw new Error("AI returned invalid JSON — please retry.");
  }
}

module.exports = { analyzeIdea };
