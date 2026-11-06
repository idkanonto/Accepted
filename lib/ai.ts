import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
export const FALLBACK_MODEL = 'gemini-3.5-flash';

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env.local (local) or Vercel env vars.');
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(key);
  }
  return cachedClient;
}

let cachedPersona: string | null = null;

/**
 * The uploaded personality. Edit lib/persona.md to change Nova's voice —
 * the file is read server-side on every request.
 */
export function getPersona(): string {
  if (cachedPersona) return cachedPersona;
  try {
    cachedPersona = readFileSync(path.join(process.cwd(), 'lib', 'persona.md'), 'utf8');
  } catch {
    cachedPersona =
      'You are a strict admissions evaluator. Write clear, complete English. No fluff. Lead with the verdict and score.';
  }
  return cachedPersona;
}

async function run(
  model: string,
  prompt: string,
  schema: object,
  maxOutputTokens: number
): Promise<string> {
  const genAI = getClient();
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens,
      responseMimeType: 'application/json',
      responseSchema: schema as never,
    },
  });
  const result = await m.generateContent(prompt);
  return result.response.text();
}

/**
 * Reasoning models spend tokens on thinking before the answer, so a short
 * budget can truncate the JSON mid-string. Try the raw text, then fenced
 * markdown, then the outermost {...} block.
 */
export function extractJSON(text: string): unknown {
  const attempts: string[] = [text];

  const fenced = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  attempts.push(fenced);

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    attempts.push(text.slice(first, last + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error('INVALID_JSON: response was not valid JSON');
}

export async function generateJSON<T>(
  prompt: string,
  schema: object,
  maxOutputTokens = 8000
): Promise<T> {
  const models =
    PRIMARY_MODEL === FALLBACK_MODEL ? [PRIMARY_MODEL] : [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const suffix =
        attempt === 0
          ? ''
          : '\n\nReturn ONLY one valid JSON object — every string escaped and closed, no truncation, no prose.';
      try {
        const raw = await run(model, prompt + suffix, schema, maxOutputTokens);
        return extractJSON(raw) as T;
      } catch (e) {
        lastError = e;
        const msg = e instanceof Error ? e.message : '';
        const retryable = /INVALID_JSON|503|429|UNAVAILABLE|overload|resource|rate/i.test(msg);
        if (!retryable) throw e;
      }
    }
  }

  throw lastError ?? new Error('Evaluation failed.');
}
