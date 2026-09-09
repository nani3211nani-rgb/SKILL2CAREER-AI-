import { env } from '../config/env.js';

function geminiConfig() {
  const apiKey = env.geminiApiKey;
  const model = env.geminiModel;

  if (!apiKey || !model) {
    throw new Error('AI service is temporarily unavailable. Your skill-gap analysis is still available.');
  }

  return { apiKey, model };
}

function groqConfig() {
  const apiKey = env.groqApiKey;
  const model = env.groqModel;
  if (!apiKey || !model) throw new Error('Groq is not configured.');
  return {apiKey, model};
}

function mistralConfig() {
  const apiKey = env.mistralApiKey;
  const model = env.mistralModel;
  if (!apiKey || !model) throw new Error('Mistral is not configured.');
  return {apiKey, model};
}

function parseJson(raw) {
  if (!raw) throw new Error('AI returned an empty response.');
  try { return JSON.parse(raw); } catch (error) {
    return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim());
  }
}

async function geminiJson(instructions, input) {
  const { apiKey, model } = geminiConfig();
  const prompt = `${instructions}\n\nJSON INPUT:\n${JSON.stringify(input, null, 2)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`AI service is temporarily unavailable. Your skill-gap analysis is still available. ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('');

  if (!raw) {
    throw new Error('AI returned an empty response. Please retry.');
  }

  return parseJson(raw);
}

async function groqJson(instructions, input) {
  const {apiKey, model} = groqConfig();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body: JSON.stringify({model,messages:[{role:'system',content:instructions},{role:'user',content:`JSON INPUT:\n${JSON.stringify(input,null,2)}`}],temperature:.2,response_format:{type:'json_object'}})
  });
  if (!response.ok) throw new Error(`Groq request failed with ${response.status}.`);
  const data=await response.json();
  return parseJson(data.choices?.[0]?.message?.content||'');
}

async function mistralJson(instructions, input) {
  const {apiKey, model} = mistralConfig();
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body: JSON.stringify({model,messages:[{role:'system',content:instructions},{role:'user',content:`JSON INPUT:\n${JSON.stringify(input,null,2)}`}],temperature:.2,response_format:{type:'json_object'}})
  });
  if (!response.ok) throw new Error(`Mistral request failed with ${response.status}.`);
  const data=await response.json();
  return parseJson(data.choices?.[0]?.message?.content||'');
}

async function json(instructions, input) {
  try {
    return await geminiJson(instructions, input);
  } catch (error) {
    console.warn(`Gemini unavailable, trying Groq: ${error.message}`);
    try { return await groqJson(instructions, input); }
    catch (fallbackError) {
      console.warn(`Groq unavailable, trying Mistral: ${fallbackError.message}`);
      try { return await mistralJson(instructions, input); }
      catch (mistralError) { console.warn(`Mistral unavailable: ${mistralError.message}`); throw new Error('Our AI services are busy right now. Please try again in a moment.'); }
    }
  }
}

export async function roadmap(context) {
  const output = await json(
    'You are an educational career guidance assistant. Use only supplied career requirements. Never invent requirements, external URLs, or promise employment. Prioritize gaps and return valid JSON: {summary, strengths, priorityGaps, roadmap:[{stage,title,skills,reason,tasks,project,estimatedDuration}],careerAdvice,interviewFocus}.',
    context
  );

  if (!Array.isArray(output.roadmap) || typeof output.summary !== 'string') {
    throw new Error('AI returned an invalid roadmap. Please retry.');
  }

  return output;
}

export async function assessment(context) {
  const output = await json(
    'You are a beginner-friendly career assessment assistant. Use only the supplied student profile and target career requirements. Return simple JSON: {summary:string,careerMatch:{title:string,score:number,reason:string},strengths:string[],missingSkills:[{name:string,why:string,priority:string}],nextSteps:string[]}. Score from 0 to 100. List only skills that are missing or need improvement. Use short sentences, plain language, and no external URLs or employment promises.',
    context
  );
  if (!output.summary || !output.careerMatch?.title || !Array.isArray(output.strengths) || !Array.isArray(output.missingSkills) || !Array.isArray(output.nextSteps)) {
    throw new Error('AI returned an invalid assessment. Please retry.');
  }
  return output;
}

export async function careerSuggestions(context) {
  const output = await json(
    'You are a practical career discovery assistant. Compare the student profile with the supplied possible careers. Return simple JSON: {careers:[{name:string,fit:number,reason:string,skillsToBuild:string[]}]}. Return up to 5 careers, sort best fit first, use scores from 0 to 100, and use short plain-language explanations. Do not invent employers, salaries, URLs, or guarantees.',
    context
  );
  if (!Array.isArray(output.careers)) throw new Error('AI returned an invalid career list. Please retry.');
  return {careers:output.careers.slice(0,5)};
}

export const chat = (context, question) => json(
  'Give cautious, practical career advice only from the supplied profile and requirements. Never invent requirements, URLs, or guarantee employment. Return JSON {answer:string,suggestedNextSteps:string[]}.',
  { ...context, question }
);
