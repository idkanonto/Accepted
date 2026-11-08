'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, MessageSquare, Mic, MicOff, RotateCcw } from 'lucide-react';
import { SIMULATOR_PROGRAMS } from '@/lib/data/prompts';
import { authFetch } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/track';
import { useAuth } from '@/components/auth-provider';
import { Notice, PageHeading } from './ui';
import ScoreRing from './score-ring';

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

const MAX_WORDS = 500;
const MAX_CHARS = 4000;

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
  const shouldRecordRef = useRef(false);
  const permissionStreamRef = useRef<MediaStream | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      shouldRecordRef.current = false;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  const currentQuestion = questions[questionIndex];
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const overLimit = words > MAX_WORDS || answer.length > MAX_CHARS;

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
      trackEvent('interview_started', { program: programCode });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Could not prepare your interview.');
      setPhase('ready');
    }
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        'Speech-to-text is not available in this browser. You can type your answer instead.'
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot request microphone access. Type your answer instead.');
      return;
    }

    setError(null);
    shouldRecordRef.current = true;
    finalTranscriptRef.current = answer.trim();

    // Ask for the microphone explicitly. Some browsers never prompt
    // SpeechRecognition on their own, and a denied permission fails silently.
    // The stream stays open while recognition runs: releasing it immediately
    // can cut the audio source on some browsers, leaving a silent session.
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        permissionStreamRef.current = stream;
        trackEvent('voice_started');
        beginRecognition(new SpeechRecognition());
      })
      .catch(() => {
        shouldRecordRef.current = false;
        setRecording(false);
        setError(
          'Microphone access was blocked. Allow microphone access in your browser, or type your answer.'
        );
      });
  }

  function beginRecognition(recognition: Recognition) {
    recognition.lang = 'en-CA';
    recognition.continuous = true;
    recognition.interimResults = true;

    const stopStream = () => {
      permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
      permissionStreamRef.current = null;
    };
    const clearWatchdog = () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
    // Some browsers report "listening" while the speech service returns nothing.
    const armWatchdog = () => {
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        setError(
          'No speech is coming through yet. Check the microphone is selected and not muted, or type your answer.'
        );
      }, 8000);
    };
    const stopRecognition = (message: string) => {
      shouldRecordRef.current = false;
      clearWatchdog();
      stopStream();
      setRecording(false);
      setError(message);
    };

    recognition.onresult = (event) => {
      armWatchdog();
      let interim = '';
      let finalized = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript;
        if (typeof transcript !== 'string') continue;
        if (result.isFinal) finalized += transcript;
        else interim += transcript;
      }
      if (finalized) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalized}`.trim();
      }
      setAnswer(`${finalTranscriptRef.current}${interim ? ` ${interim}` : ''}`.trim());
    };

    recognition.onerror = (event) => {
      trackEvent('voice_error', { error: event.error });
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopRecognition(
          'Microphone access was blocked. Allow microphone access or type your answer.'
        );
      } else if (event.error === 'audio-capture') {
        stopRecognition('No microphone was found. Check your device or type your answer.');
      } else if (event.error === 'network') {
        stopRecognition(
          'The speech recognition service is unreachable. Check your connection or type your answer.'
        );
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Speak a little louder, or type your answer.');
      }
      // 'aborted' is transient; onend restarts the session.
    };

    recognition.onend = () => {
      if (!shouldRecordRef.current) {
        clearWatchdog();
        stopStream();
        setRecording(false);
        recognitionRef.current = null;
        return;
      }
      // Chrome ends the session after a short pause. Restart while the user is
      // still answering; a brief delay avoids an InvalidStateError.
      setTimeout(() => {
        if (!shouldRecordRef.current) {
          clearWatchdog();
          stopStream();
          setRecording(false);
          recognitionRef.current = null;
          return;
        }
        try {
          setError(null);
          recognition.start();
        } catch {
          stopRecognition(
            'Speech recognition stopped. Press the microphone to continue, or type your answer.'
          );
        }
      }, 120);
    };

    recognitionRef.current = recognition;
    armWatchdog();
    try {
      recognition.start();
      setRecording(true);
    } catch {
      recognitionRef.current = null;
      clearWatchdog();
      stopStream();
      shouldRecordRef.current = false;
      setError(
        'Could not start speech recognition. Check microphone permissions or type your answer.'
      );
    }
  }

  function stopRecording() {
    shouldRecordRef.current = false;
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
    permissionStreamRef.current = null;
    recognitionRef.current?.stop();
    setRecording(false);
    setAnswer(finalTranscriptRef.current.trim());
    trackEvent('voice_stopped', {
      words: String(finalTranscriptRef.current.trim().split(/\s+/).filter(Boolean).length),
    });
  }

  async function advance() {
    if (answer.trim().length < 20) {
      setError('Add a complete response before moving to the next question.');
      return;
    }
    if (overLimit) {
      setError(`Keep each answer under ${MAX_WORDS} words so it fits the real format.`);
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
      trackEvent('interview_completed', { score: String(data.overallScore) });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Could not review this interview.');
      setPhase('answering');
    }
  }

  function reset() {
    stopRecording();
    setQuestions([]);
    setAnswers([]);
    setQuestionIndex(0);
    setAnswer('');
    setReview(null);
    setError(null);
    setPhase('ready');
  }

  return (
    <div>
      <PageHeading
        eyebrow="PREPARE & PRACTISE / MOCK INTERVIEW"
        title="A little practice. A little more you."
      >
        Answer three program-focused questions using your voice or keyboard. Your transcript is
        reviewed for substance and clarity. Microphone audio is never uploaded to Accepted.
      </PageHeading>
      <div className="interview-studio">
        <aside className="min-w-0 lg:sticky lg:top-28">
          <div className="mb-6 flex items-center gap-3">
            <span className="icon-tile">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Your interview studio</p>
              <p className="text-xs text-muted">A little space to find your voice.</p>
            </div>
          </div>
          <div className="space-y-5 border-l border-line pl-5">
            {[
              { label: 'Set your direction', description: 'Choose a program area.' },
              { label: 'Tell your story', description: 'Speak naturally or type your response.' },
              { label: 'Reflect & refine', description: 'Take one useful lesson forward.' },
            ].map((step, i) => (
              <div key={step.label}>
                <p
                  className={`text-xs font-semibold ${(i === 0 && phase === 'ready') || (i === 1 && phase === 'answering') || (i === 2 && phase === 'results') ? 'text-accent' : 'text-cream'}`}
                >
                  {String(i + 1).padStart(2, '0')} / {step.label}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">{step.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-muted">
            Questions are generated for practice and are not official or leaked admissions
            questions. Answer from your own experience.
          </p>
        </aside>
        <section className="panel min-w-0 p-5 sm:p-8" aria-label="Mock interview workspace">
          {phase === 'ready' && (
            <div className="mx-auto max-w-xl py-3">
              <p className="eyebrow">BEFORE YOU BEGIN</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Make yourself comfortable.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Find a quiet space. Think about experiences that show how you learn, contribute, and
                grow. There’s no need to have the perfect answer.
              </p>
              <div className="my-7 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-ink p-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" aria-hidden="true" />3 questions
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mic className="h-4 w-4 text-accent" aria-hidden="true" />
                  Voice or keyboard
                </span>
              </div>
              <label htmlFor="interview-program" className="label">
                Choose a program area
              </label>
              <select
                id="interview-program"
                value={programCode}
                onChange={(event) => setProgramCode(event.target.value)}
                className="input"
              >
                {SIMULATOR_PROGRAMS.map((program) => (
                  <option key={program.code} value={program.code}>
                    {program.label}
                  </option>
                ))}
              </select>
              <button
                onClick={beginInterview}
                disabled={authLoading}
                className="btn-primary mt-5 w-full"
              >
                {authLoading ? 'Checking your account…' : 'Start mock interview'}
                {!authLoading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              <p className="mt-4 text-xs leading-6 text-muted">
                The microphone is optional. Speech recognition runs in your browser and may send
                audio to its own recognition service.
              </p>
            </div>
          )}
          {phase === 'loading' && (
            <div className="py-20 text-center" role="status">
              <Loader2
                className="mx-auto mb-5 h-7 w-7 animate-spin text-accent"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold">Preparing your questions…</h2>
              <p className="mt-2 text-sm text-muted">A moment to get your practice round ready.</p>
            </div>
          )}
          {phase === 'answering' && currentQuestion && (
            <div>
              <div className="mb-7 flex items-center justify-between gap-4">
                <p className="eyebrow">
                  QUESTION {questionIndex + 1} OF {questions.length}
                </p>
                <div
                  className="flex gap-1.5"
                  aria-label={`Question ${questionIndex + 1} of ${questions.length}`}
                >
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-8 rounded-full ${i <= questionIndex ? 'bg-accent' : 'bg-line'}`}
                    />
                  ))}
                </div>
              </div>
              <h2 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                {currentQuestion}
              </h2>
              <div className="mt-7 flex flex-wrap items-center gap-4 rounded-xl bg-ink p-4">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  aria-pressed={recording}
                  className={recording ? 'btn-danger' : 'btn-ghost'}
                >
                  {recording ? (
                    <MicOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Mic className="h-4 w-4 text-accent" aria-hidden="true" />
                  )}
                  {recording ? 'Stop speaking' : 'Answer by voice'}
                </button>
                <p className="max-w-xs text-xs leading-6 text-muted" role="status">
                  {recording
                    ? 'Listening… select stop when you are finished.'
                    : 'Optional. Your browser may send speech to its own recognition service.'}
                </p>
              </div>
              <label htmlFor="interview-answer" className="label mt-7">
                Your response
              </label>
              <textarea
                id="interview-answer"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  finalTranscriptRef.current = event.target.value;
                }}
                maxLength={MAX_CHARS}
                rows={7}
                aria-describedby="interview-word-count"
                aria-invalid={overLimit}
                placeholder="Use a specific example. Explain what you did, why it mattered, and what you learned."
                className="input min-h-[220px] resize-y !bg-panel !text-base leading-7"
              />
              <div
                id="interview-word-count"
                className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className={overLimit ? 'font-medium text-rose' : 'text-muted'}>
                  {words} / {MAX_WORDS} words
                </span>
                {overLimit && (
                  <span className="text-rose">Over the limit — trim before continuing.</span>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={advance} disabled={recording} className="btn-primary">
                  {questionIndex === questions.length - 1 ? 'Finish and review' : 'Next question'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {phase === 'analyzing' && (
            <div className="py-20 text-center" role="status">
              <Loader2
                className="mx-auto mb-5 h-7 w-7 animate-spin text-accent"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold">Reviewing your responses…</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted">
                Your transcript is being assessed against clear practice criteria.
              </p>
            </div>
          )}
          {phase === 'results' && review && (
            <div>
              <div className="flex flex-wrap items-center gap-5 border-b border-line pb-6">
                <ScoreRing score={review.overallScore} />
                <div>
                  <p className="eyebrow">YOUR INTERVIEW REVIEW</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">A clear next step.</h2>
                  <p className="mt-1 text-xs text-muted">
                    Practice feedback, not an admissions decision.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-base leading-8 text-cream">{review.overallAssessment}</p>
              <div className="mt-7 divide-y divide-line">
                {review.dimensions.map((dimension) => (
                  <article key={dimension.name} className="py-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">{dimension.name}</h3>
                      <span className="rounded-lg bg-accent-deep px-3 py-1 text-sm font-semibold tabular-nums text-accent">
                        {dimension.score}
                        <span className="ml-1 text-[10px] font-normal">/ 100</span>
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">{dimension.evidence}</p>
                    <p className="mt-2 text-sm leading-7 text-cream">{dimension.coaching}</p>
                  </article>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-ink p-5">
                <h3 className="text-sm font-semibold">Take this into your next attempt</h3>
                <ol className="mt-4 space-y-4">
                  {review.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm leading-7 text-muted">
                      <span className="number-label !h-6 !w-6 !bg-panel">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <button onClick={reset} className="btn-ghost mt-6">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Start another round
              </button>
            </div>
          )}
          {error && (
            <div role="alert" className="feedback-error mt-5">
              {error}
            </div>
          )}
        </section>
      </div>
      <div className="mt-6">
        <Notice>
          Feedback is a practice aid, not an admissions decision. Speech recognition is provided by
          your browser platform and may use its own service; only your transcript is sent to
          Accepted for review.
        </Notice>
      </div>
    </div>
  );
}
