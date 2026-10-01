import { env } from "../config/env.js";

function geminiConfig() {
  const apiKey = env.geminiApiKey;
  const model = env.geminiModel;

  if (!apiKey || !model) {
    throw new Error(
      "AI service is temporarily unavailable. Your skill-gap analysis is still available.",
    );
  }

  return { apiKey, model };
}

function groqConfig() {
  const apiKey = env.groqApiKey;
  const model = env.groqModel;
  if (!apiKey || !model) throw new Error("Groq is not configured.");
  return { apiKey, model };
}

function mistralConfig() {
  const apiKey = env.mistralApiKey;
  const model = env.mistralModel;
  if (!apiKey || !model) throw new Error("Mistral is not configured.");
  return { apiKey, model };
}

function parseJson(raw) {
  if (!raw) throw new Error("AI returned an empty response.");
  try {
    return JSON.parse(raw);
  } catch (error) {
    return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "").trim());
  }
}

async function geminiJson(instructions, input) {
  const { apiKey, model } = geminiConfig();
  const prompt = `${instructions}\n\nJSON INPUT:\n${JSON.stringify(input, null, 2)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `AI service is temporarily unavailable. Your skill-gap analysis is still available. ${text.slice(0, 200)}`,
    );
  }

  const data = await response.json();
  const raw = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("");

  if (!raw) {
    throw new Error("AI returned an empty response. Please retry.");
  }

  return parseJson(raw);
}

async function groqJson(instructions, input) {
  const { apiKey, model } = groqConfig();
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: instructions },
          {
            role: "user",
            content: `JSON INPUT:\n${JSON.stringify(input, null, 2)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Groq request failed with ${response.status}.`);
  const data = await response.json();
  return parseJson(data.choices?.[0]?.message?.content || "");
}

async function mistralJson(instructions, input) {
  const { apiKey, model } = mistralConfig();
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instructions },
        {
          role: "user",
          content: `JSON INPUT:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok)
    throw new Error(`Mistral request failed with ${response.status}.`);
  const data = await response.json();
  return parseJson(data.choices?.[0]?.message?.content || "");
}

async function json(instructions, input) {
  try {
    return await geminiJson(instructions, input);
  } catch (error) {
    console.warn(`Gemini unavailable, trying Groq: ${error.message}`);
    try {
      return await groqJson(instructions, input);
    } catch (fallbackError) {
      console.warn(
        `Groq unavailable, trying Mistral: ${fallbackError.message}`,
      );
      try {
        return await mistralJson(instructions, input);
      } catch (mistralError) {
        console.warn(`Mistral unavailable: ${mistralError.message}`);
        throw new Error(
          "Our AI services are busy right now. Please try again in a moment.",
        );
      }
    }
  }
}

export async function roadmap(context) {
  const output = await json(
    "You are an educational career guidance assistant. Use only supplied career requirements and the verified skill gap. Never invent requirements, external URLs, salaries, or promise employment. Build a deep but practical roadmap: order the real gaps from foundational to advanced, explain why each stage matters, include 3-5 concrete tasks, one measurable project, an estimated duration, career advice, and interview focus. Return valid JSON: {summary, strengths, priorityGaps, roadmap:[{stage,title,skills,reason,tasks,project,estimatedDuration}],careerAdvice,interviewFocus}.",
    context,
  );

  if (!Array.isArray(output.roadmap) || typeof output.summary !== "string") {
    throw new Error("AI returned an invalid roadmap. Please retry.");
  }

  return output;
}

export async function assessment(context) {
  const output = await json(
    "You are a beginner-friendly career assessment assistant. Understand free-form interest and career phrases by their meaning, including spelling variations and related subjects. Use only the supplied student profile and target career requirements; if a typed career has no requirements, say what can and cannot be assessed and use the student profile to suggest sensible next steps. Return simple JSON: {summary:string,careerMatch:{title:string,score:number,reason:string},strengths:string[],missingSkills:[{name:string,why:string,priority:string}],nextSteps:string[]}. Score from 0 to 100. List only skills that are missing or need improvement. Use short sentences, plain language, and no external URLs or employment promises.",
    context,
  );
  if (
    !output.summary ||
    !output.careerMatch?.title ||
    !Array.isArray(output.strengths) ||
    !Array.isArray(output.missingSkills) ||
    !Array.isArray(output.nextSteps)
  ) {
    throw new Error("AI returned an invalid assessment. Please retry.");
  }
  return output;
}

export async function extractResumeWithAI(resumeText, targetCareer) {
  const output = await json(
    "Analyze only the actual resume text supplied by the user. Extract only facts explicitly supported by that text; do not infer or invent skills, projects, education, experience, certifications, internships, technologies, achievements, or a name. For every extracted item, include a verbatim evidence excerpt copied from the resume. Return strict JSON with exactly these fields: {name:string|null,skills:[{name:string,confidence:number,evidence:string}],projects:[{name:string,technologies:string[],evidence:string}],education:[{evidence:string}],experience:[{evidence:string}],certifications:[{name:string,evidence:string}],internships:[{evidence:string}],achievements:[{evidence:string}]}.",
    { resumeText, targetCareer },
  );
  const arrays = [
    "skills",
    "projects",
    "education",
    "experience",
    "certifications",
    "internships",
    "achievements",
  ];
  if (
    !(output.name === null || typeof output.name === "string") ||
    arrays.some((key) => !Array.isArray(output[key]))
  ) {
    throw new Error("AI returned an invalid resume analysis.");
  }
  for (const key of arrays) {
    if (
      output[key].some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          typeof item.evidence !== "string",
      )
    ) {
      throw new Error("AI returned resume items without evidence.");
    }
  }
  if (
    output.skills.some(
      (item) =>
        typeof item.name !== "string" || typeof item.confidence !== "number",
    ) ||
    output.projects.some(
      (item) =>
        typeof item.name !== "string" || !Array.isArray(item.technologies),
    ) ||
    output.certifications.some((item) => typeof item.name !== "string")
  ) {
    throw new Error("AI returned resume fields with invalid types.");
  }
  return output;
}

export async function evaluateInterviewAnswer(context) {
  const output = await json(
    'You are evaluating a candidate answer to one interview question. Analyze only the exact answer provided. Do not invent statements, examples, experience, or knowledge that are not in the answer. Assess correctness and relevance to the question, completeness, reasoning, specificity, and communication. A short answer such as "I do not know" must receive low scores and feedback that acknowledges the answer did not explain a solution; never reward it for content it does not contain. Return strict JSON: {score:number,communicationScore:number,feedback:string,strengths:string[],weaknesses:string[]}. Both scores must be integers from 0 to 100. Feedback must refer to concrete content or omissions in this answer. Strengths may be empty. Provide actionable weaknesses when the answer is incomplete.',
    context,
  );
  const validScore = (score) =>
    Number.isInteger(score) && score >= 0 && score <= 100;
  if (
    !validScore(output.score) ||
    !validScore(output.communicationScore) ||
    typeof output.feedback !== "string" ||
    !output.feedback.trim() ||
    !Array.isArray(output.strengths) ||
    !output.strengths.every((item) => typeof item === "string") ||
    !Array.isArray(output.weaknesses) ||
    !output.weaknesses.every((item) => typeof item === "string")
  ) {
    throw new Error("AI returned an invalid interview evaluation.");
  }
  return output;
}

export async function careerSuggestions(context) {
  const output = await json(
    "You are a practical career discovery assistant. Compare the student profile with the supplied possible careers. Return simple JSON: {careers:[{name:string,fit:number,reason:string,skillsToBuild:string[]}]}. Return up to 5 careers, sort best fit first, use scores from 0 to 100, and use short plain-language explanations. Do not invent employers, salaries, URLs, or guarantees.",
    context,
  );
  if (!Array.isArray(output.careers))
    throw new Error("AI returned an invalid career list. Please retry.");
  return { careers: output.careers.slice(0, 5) };
}

export const chat = (context, question) =>
  json(
    "Give cautious, practical career advice only from the supplied profile and requirements. Never invent requirements, URLs, or guarantee employment. Return JSON {answer:string,suggestedNextSteps:string[]}.",
    { ...context, question },
  );
