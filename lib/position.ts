export const PLANNER_KEY = 'accepted-application-planner-v1';
export const EC_KEY = 'accepted-ec-result-v1';

export type EcLevel = 'light' | 'solid' | 'strong' | 'standout';
export const EC_LEVELS: EcLevel[] = ['light', 'solid', 'strong', 'standout'];

export function averageRange(label: string): [number, number] | null {
  const values = label.match(/\d{2}/g)?.map(Number);
  if (!values?.length) return null;
  if (label.includes('+')) return [values[0], values[0]];
  if (values.length > 1) return [values[0], values[1]];
  return [values[0], values[0]];
}

export function academicPosition(average: number, label: string) {
  const range = averageRange(label);
  if (!range) return null;
  const [low, high] = range;
  if (average >= high) {
    return {
      title: 'Above the listed reference range',
      description: 'Your current average is above this broad reference point.',
      tone: 'text-accent',
    };
  }
  if (average >= low - 2) {
    return {
      title: 'Near the listed reference range',
      description: 'Your current average is close to this broad reference point.',
      tone: 'text-cream',
    };
  }
  return {
    title: 'Below the listed reference range',
    description: 'Your current average is below this broad reference point.',
    tone: 'text-rose',
  };
}

// Derived from the listed requirement text, so the markers never drift from the data.
// shortcut: keyword match, not hand-curated; replace with explicit fields if a program is misread.
const LONG_ANSWER = /essay|written|one idea|statements? of intent|personal statement|writing|\bSAF\b/i;
const BACKGROUND =
  /\bAIF\b|information form|student profile|supplementary profile|extracurricular|\bABS\b|experience|leadership|personal profile/i;

export function suppSignals(req: string) {
  return { longAnswer: LONG_ANSWER.test(req), background: BACKGROUND.test(req) };
}

function readJSON(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function readPlannerAverage(): number | null {
  const a = readJSON(PLANNER_KEY)?.average;
  return typeof a === 'number' && a >= 0 && a <= 100 ? a : null;
}

export function readEcLevel(): EcLevel | null {
  const l = readJSON(EC_KEY)?.level;
  return EC_LEVELS.includes(l as EcLevel) ? (l as EcLevel) : null;
}
