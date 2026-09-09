import 'dotenv/config';
const geminiApiKey=(process.env.GEMINI_API_KEY||'').trim().replace(/^GEMINI_API_KEY=/,'');
const geminiModel=(process.env.GEMINI_MODEL||'gemini-3.6-flash').trim();
const groqApiKey=(process.env.GROQ_API_KEY||'').trim().replace(/^GROQ_API_KEY=/,'');
const groqModel=(process.env.GROQ_MODEL||'openai/gpt-oss-120b').trim();
const mistralApiKey=(process.env.MISTRAL_API_KEY||'').trim().replace(/^MISTRAL_API_KEY=/,'');
const mistralModel=(process.env.MISTRAL_MODEL||'mistral-small-latest').trim();
export const env={
  port:Number(process.env.PORT||3000),
  geminiApiKey,
  geminiModel,
  groqApiKey,
  groqModel,
  mistralApiKey,
  mistralModel
};
