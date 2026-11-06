/**
 * Shared types. Persistence lives in Supabase now — see lib/supabase/ and
 * lib/queue.ts. These types are kept here so analytics and the simulator agree
 * on the shape of a scored attempt.
 */
export type Feedback = {
  score: number;
  verdict: string;
  strengths: string[];
  fixes: string[];
  rewrite: string;
};

export type Attempt = {
  id: string;
  programCode: string;
  program: string;
  university: string;
  question: string;
  answer: string;
  feedback: Feedback;
  createdAt: number;
};
