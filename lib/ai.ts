import { readFileSync } from 'node:fs';
import path from 'node:path';

export const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq answers in about a second; the abort is a safety net so a stalled
// request can never hang a Vercel function until its timeout.
const TIMEOUT_MS = 25_000;

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

function normalizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeSchema);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Groq expects JSON Schema type keywords; the Gemini-style schemas in
      // this codebase use uppercase, which Groq's preprocessor rejects.
      out[key] =
        key === 'type' && typeof val === 'string' ? val.toLowerCase() : normalizeSchema(val);
    }
    // Groq's strict mode requires this on every object, including nested ones.
    if (out.type === 'object' && out.properties && out.additionalProperties === undefined) {
      out.additionalProperties = false;
    }
    return out;
  }
  return value;
}

async function run(
  model: string,
  prompt: string,
  schema: object,
  maxOutputTokens: number
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not set. Add it to .env.local (local) or Vercel env vars.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: maxOutputTokens,
        // Reasoning tokens are pure latency here; the rubric is in the prompt.
        reasoning_effort: 'low',
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'response', strict: true, schema: normalizeSchema(schema) },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`GROQ_${res.status} ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('GROQ_EMPTY_RESPONSE');
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A reasoning model can wrap the object in prose or fences. Try the raw text,
 * then fenced markdown, then the outermost {...} block.
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
  const models = PRIMARY_MODEL === FALLBACK_MODEL ? [PRIMARY_MODEL] : [PRIMARY_MODEL, FALLBACK_MODEL];
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
        const retryable =
          /INVALID_JSON|GROQ_429|GROQ_5|GROQ_408|aborted|fetch failed|ENOTFOUND|ETIMEDOUT/i.test(msg);
        if (!retryable) throw e;
      }
    }
  }

  throw lastError ?? new Error('Evaluation failed.');
}
