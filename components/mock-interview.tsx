'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Mic, MicOff, RotateCcw, Volume2 } from 'lucide-react';
import { SIMULATOR_PROGRAMS } from '@/lib/data/prompts';
import { authFetch } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';

type Phase = 'ready' | 'loading' | 'answering' | 'analyzing' | 'results';

type InterviewReview = {
  overallScore: number;
  overallAssessment: string;
  dimensions: { name: string; score: number; evidence: string; coaching: string }[];
  nextSteps: string[];
};

type InterviewAnswer = {
  question: string;
  answer: string;
};

type RecognitionResult = { transcript: string };
type RecognitionItem = { isFinal: boolean; 0: RecognitionResult };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionItem> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  }
}

export default function MockInterview() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const [phase, setPhase] = useState<Phase>('ready');
  const [programCode, setProgramCode] = useState(SIMULATOR_PROGRAMS[0].code);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<InterviewReview | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const currentQuestion = questions[questionIndex];

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-CA';
    window.speechSynthesis.speak(utterance);
  }

  async function beginInterview() {
    if (authLoading) return;
    if (!user) {
      openAuth();
      return;
    }
    setPhase('loading');
    setError(null);
    setReview(null);
    try {
      const response = await authFetch('/api/interview', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', programCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not prepare your interview.');
      setQuestions(data.questions);
      setAnswers([]);
      setQuestionIndex(0);
      setAnswer('');
      setPhase('answering');
      if (data.questions?.[0]) speak(data.questions[0]);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Could not prepare your interview.');
      setPhase('ready');
    }
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech-to-text is not available in this browser. You can type your answer instead.');
      return;
    }

    setError(null);
    finalTranscriptRef.current = answer.trim();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-CA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = '';
      let finalized = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalized += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (finalized) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalized}`.trim();
      }
      setAnswer(`${finalTranscriptRef.current}${interim ? ` ${interim}` : ''}`.trim());
    };
    recognition.onerror = (event) => {
      setRecording(false);
      setError(
        event.error === 'not-allowed'
          ? 'Microphone access was blocked. Allow microphone access or type your answer.'
          : 'Speech recognition stopped. You can continue by typing your answer.'
      );
    };
    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      recognitionRef.current = null;
      setError('Could not start speech recognition. Check microphone permissions or type your answer.');
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function advance() {
    if (answer.trim().length < 20) {
      setError('Add a complete response before moving to the next question.');
      return;
    }

    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = {
      question: currentQuestion,
      answer: answer.trim(),
    };
    setAnswers(updatedAnswers);
    setError(null);

    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setAnswer('');
      finalTranscriptRef.current = '';
      speak(questions[nextIndex]);
      return;
    }

    setPhase('analyzing');
    try {
      const response = await authFetch('/api/interview', {
        method: 'POST',
        body: JSON.stringify({ action: 'analyze', answers: updatedAnswers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not review this interview.');
      setReview(data as InterviewReview);
      setPhase('results');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Could not review this interview.');
      setPhase('answering');
    }
  }

  function reset() {
    stopRecording();
    window.speechSynthesis?.cancel();
    setQuestions([]);
    setAnswers([]);
    setQuestionIndex(0);
    setAnswer('');
    setReview(null);
    setError(null);
    setPhase('ready');
  }

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <p className="eyebrow">Voice practice</p>
        <h1 className="mt-3 text-3xl font-medium leading-tight text-cream sm:text-4xl">
          Rehearse out loud. Reflect with purpose.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Answer three program-focused questions using your voice or keyboard. Your transcript
          is reviewed for substance and clarity; Accepted never receives or stores your audio.
        </p>
      </header>

      <section className="panel mx-auto max-w-4xl p-5 sm:p-8">
        {phase === 'ready' && (
          <div className="mx-auto max-w-xl py-4">
            <p className="eyebrow">Before you begin</p>
            <h2 className="mt-3 text-2xl font-medium text-cream">Set up a short practice round</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Questions are generated for practice and are not represented as official or leaked
              admissions questions. Use a quiet space and answer from your own experience.
            </p>
            <label htmlFor="interview-program" className="mb-2 mt-6 block text-sm font-medium text-cream">
              Choose a program area
            </label>
            <select
              id="interview-program"
              value={programCode}
              onChange={(event) => setProgramCode(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-panel px-3 text-sm text-cream"
            >
              {SIMULATOR_PROGRAMS.map((program) => (
                <option key={program.code} value={program.code}>{program.label}</option>
              ))}
            </select>
            <button
              onClick={beginInterview}
              disabled={authLoading}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-soft disabled:opacity-60"
            >
              {authLoading ? 'Checking your account…' : 'Start mock interview'}
              {!authLoading && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-3 text-xs leading-5 text-muted">
              A microphone is optional. Speech recognition availability depends on your browser.
            </p>
          </div>
        )}

        {phase === 'loading' && (
          <div className="py-16 text-center" role="status">
            <p className="text-sm font-medium text-cream">Preparing your questions…</p>
            <p className="mt-2 text-sm text-muted">This can take a few seconds.</p>
          </div>
        )}

        {phase === 'answering' && currentQuestion && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">Question {questionIndex + 1} of {questions.length}</p>
              <button
                onClick={() => speak(currentQuestion)}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-accent transition hover:bg-ink"
              >
                <Volume2 className="h-4 w-4" /> Read question aloud
              </button>
            </div>
            <h2 className="mt-5 text-2xl font-medium leading-snug text-cream sm:text-3xl">
              {currentQuestion}
            </h2>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  recording
                    ? 'bg-rose text-white hover:opacity-90'
                    : 'bg-accent px-4 text-white hover:bg-accent-soft'
                }`}
              >
                {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {recording ? 'Stop speaking' : 'Answer by voice'}
              </button>
              <span className="text-xs text-muted">
                {recording ? 'Listening… select stop when you are finished.' : 'Or type your response below.'}
              </span>
            </div>
            <label htmlFor="interview-answer" className="mb-2 mt-5 block text-sm font-medium text-cream">
              Your response
            </label>
            <textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                finalTranscriptRef.current = event.target.value;
              }}
              maxLength={6000}
              rows={7}
              placeholder="Use a specific example. Explain what you did, why it mattered, and what you learned."
              className="w-full resize-y rounded-xl border border-line bg-ink px-4 py-3 text-sm leading-6 text-cream placeholder:text-muted/80"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">{answer.trim().split(/\s+/).filter(Boolean).length} words</p>
              <button
                onClick={advance}
                disabled={recording}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-soft disabled:opacity-50"
              >
                {questionIndex === questions.length - 1 ? 'Finish and review' : 'Next question'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="py-16 text-center" role="status">
            <p className="text-sm font-medium text-cream">Reviewing your responses…</p>
            <p className="mt-2 text-sm text-muted">Your transcript is being assessed against clear practice criteria.</p>
          </div>
        )}

        {phase === 'results' && review && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
              <div>
                <p className="eyebrow">Interview review</p>
                <h2 className="mt-2 text-2xl font-medium text-cream">A clear next step</h2>
              </div>
              <div className="rounded-2xl bg-accent-deep px-5 py-3 text-center">
                <p className="text-2xl font-semibold text-accent">{review.overallScore}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Practice score</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-cream">{review.overallAssessment}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {review.dimensions.map((dimension) => (
                <article key={dimension.name} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-medium text-cream">{dimension.name}</h3>
                    <span className="text-sm font-semibold text-accent">{dimension.score}</span>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-muted">{dimension.evidence}</p>
                  <p className="mt-2 text-sm leading-5 text-cream">{dimension.coaching}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-ink p-5">
              <h3 className="text-base font-medium text-cream">For your next attempt</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-5 text-muted">
                {review.nextSteps.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </div>
            <button
              onClick={reset}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-cream transition hover:bg-ink"
            >
              <RotateCcw className="h-4 w-4" /> Start another round
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose"
          >
            {error}
          </div>
        )}
      </section>

      <p className="mx-auto flex max-w-4xl items-start gap-2 text-xs leading-5 text-muted">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        Feedback is a practice aid, not an admissions decision. Speech recognition is provided
        by your browser platform and may use its own service; only your transcript is sent to
        Accepted for review.
      </p>
    </div>
  );
}
