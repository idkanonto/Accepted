import type { Attempt } from './storage';

export type ProgramStat = {
  program: string;
  university: string;
  count: number;
  avg: number;
};

export type Stats = {
  total: number;
  avgScore: number;
  bestScore: number;
  perProgram: ProgramStat[];
  recent: Attempt[];
  weakest: ProgramStat | null;
  strongest: ProgramStat | null;
  /** Last 8 weeks of average scores, oldest first. */
  trend: { label: string; avg: number | null }[];
};

export function computeStats(attempts: Attempt[]): Stats {
  if (attempts.length === 0) {
    return {
      total: 0,
      avgScore: 0,
      bestScore: 0,
      perProgram: [],
      recent: [],
      weakest: null,
      strongest: null,
      trend: [],
    };
  }

  const scores = attempts.map((a) => a.feedback.score);
  const avgScore = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
  const bestScore = Math.max(...scores);

  const map = new Map<string, { program: string; university: string; scores: number[] }>();
  for (const a of attempts) {
    const key = a.programCode || a.program;
    const entry = map.get(key) ?? { program: a.program, university: a.university, scores: [] };
    entry.scores.push(a.feedback.score);
    map.set(key, entry);
  }

  const perProgram: ProgramStat[] = Array.from(map.entries())
    .map(([code, v]) => ({
      program: v.program,
      university: v.university,
      count: v.scores.length,
      avg: Math.round(v.scores.reduce((s, n) => s + n, 0) / v.scores.length),
      code,
    }))
    .sort((a, b) => b.count - a.count);

  const weakest = [...perProgram].sort((a, b) => a.avg - b.avg)[0] ?? null;
  const strongest = [...perProgram].sort((a, b) => b.avg - a.avg)[0] ?? null;

  return {
    total: attempts.length,
    avgScore,
    bestScore,
    perProgram,
    recent: attempts.slice(0, 8),
    weakest,
    strongest,
    trend: buildTrend(attempts),
  };
}

function buildTrend(attempts: Attempt[]): { label: string; avg: number | null }[] {
  const now = new Date();
  const weeks: { label: string; start: Date; end: Date; scores: number[] }[] = [];

  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({
      label: start.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      start,
      end,
      scores: [],
    });
  }

  for (const a of attempts) {
    const d = new Date(a.createdAt);
    for (const w of weeks) {
      if (d >= w.start && d < w.end) {
        w.scores.push(a.feedback.score);
        break;
      }
    }
  }

  return weeks.map((w) => ({
    label: w.label,
    avg: w.scores.length
      ? Math.round(w.scores.reduce((s, n) => s + n, 0) / w.scores.length)
      : null,
  }));
}
