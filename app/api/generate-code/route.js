import OpenAI from "openai";
import { NextResponse } from "next/server";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY=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
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function safeParse(text) {
  if (typeof text !== "string") return null;

  let cleaned = text.trim();

  // Strip common Markdown code fences, e.g. ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  // First, try parsing the cleaned string directly
  let parsed = tryParse(cleaned);
  if (parsed !== null) return parsed;

  // If that fails, try to extract a JSON-looking substring
  const firstCurly = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const startCandidates = [firstCurly, firstBracket].filter((idx) => idx !== -1);
  const start = startCandidates.length ? Math.min(...startCandidates) : -1;

  const lastCurly = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const end = Math.max(lastCurly, lastBracket);

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const maybeJson = cleaned.slice(start, end + 1);
  return tryParse(maybeJson);
}

function slugify(value) {
  return (value || "ai-app")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function normalizeFiles(data, input) {
  const projectName = data?.projectName || input.idea;
  const summary =
    data?.summary ||
    `Starter Next.js files for ${input.idea} with ${input.features}.`;

  const fallbackFiles = [
    {
      path: "app/page.tsx",
      content: `export default function Page() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>${projectName}</h1>
      <p>${summary}</p>
    </main>
  );
}
`,
    },
    {
      path: "components/hero.tsx",
      content: `export function Hero() {
  return (
    <section>
      <h2>${input.idea}</h2>
      <p>${input.style} interface with ${input.features}</p>
    </section>
  );
}
`,
    },
    {
      path: "app/api/generate/route.ts",
      content: `export async function POST() {
  return Response.json({ ok: true });
}
`,
    },
  ];

  return {
    projectName,
    summary,
    files: Array.isArray(data?.files) && data.files.length
      ? data.files.filter(
          (file) =>
            file &&
            typeof file.path === "string" &&
            typeof file.content === "string"
        )
      : fallbackFiles,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      idea = "AI App Builder",
      appType = "Next.js SaaS",
      style = "Modern dark",
      features = "Landing page, dashboard, API integration",
    } = body || {};

    const projectSlug = slugify(idea);

    const prompt = `
Generate starter code files for a Next.js app.

Return ONLY valid JSON.
No markdown.
No code fences.
No explanation.

Use this exact shape:
{
  "projectName": "string",
  "summary": "string",
  "files": [
    {
      "path": "string",
      "content": "string"
    }
  ]
}

Requirements:
- The app concept is: ${idea}
- App type: ${appType}
- Visual style: ${style}
- Features: ${features}
- Make the files practical and coherent
- Output 3 to 5 files
- Prefer Next.js App Router structure
- Include at least:
  - app/page.tsx
  - one reusable component file
  - one API route file
- Use TypeScript/TSX for app/component files when appropriate
- Keep code compact but real
- The project slug is: ${projectSlug}
`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5.1-codex-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You generate strict JSON containing starter code files for Next.js projects.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "";
    const parsed = safeParse(text);

    return NextResponse.json(
      normalizeFiles(parsed, { idea, appType, style, features })
    );
  } catch (error) {
    console.error("generate-code route error:", error);

    return NextResponse.json(
      { error: "Failed to generate code files." },
      { status: 500 }
    );
  }
}
