// Synthetic browser fixtures only. These never call Supabase, Groq, or real APIs.
const now = Date.now();
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "jordan@example.test",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-01-01T12:00:00.000Z",
  identities: [],
};
const tokenPart = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const session = {
  access_token: `${tokenPart({ alg: "HS256", typ: "JWT" })}.${tokenPart({ sub: user.id, aud: "authenticated", exp: 2208988800 })}.Zml4dHVyZQ`,
  refresh_token: "frontend-fixture-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 2208988800,
  user,
};
const feedback = {
  score: 84,
  verdict:
    "A thoughtful response with a clear sense of responsibility. Make the impact as specific as the experience.",
  strengths: [
    "A concrete example shows your contribution.",
    "Your reflection connects action to learning.",
  ],
  fixes: [
    "Quantify the change you helped make.",
    "Close with how this will shape your next decision.",
  ],
  rewrite:
    "When our robotics team lost access to its usual practice space, I coordinated a new schedule with the library and divided our build into smaller tasks. We tested each part in short sessions, documented what worked, and made sure newer members could contribute. The experience taught me that leadership can mean making progress possible for other people.",
};
const review = {
  overallScore: 81,
  overallAssessment:
    "Your answers show a clear sense of purpose. Bring the same specificity to the outcome as you do to your actions.",
  dimensions: [
    {
      name: "Clarity",
      score: 82,
      evidence: "Your examples follow a clear sequence.",
      coaching: "Start with one sentence that sets the scene.",
    },
    {
      name: "Reflection",
      score: 80,
      evidence: "You explain what changed in your thinking.",
      coaching: "Connect the lesson to a future decision.",
    },
    {
      name: "Specificity",
      score: 78,
      evidence: "Concrete actions give the story credibility.",
      coaching: "Add a measurable outcome where you can.",
    },
  ],
  nextSteps: [
    "Practise a concise opening.",
    "Name the impact of your contribution.",
    "Leave room for a reflective closing.",
  ],
};
const questions = [
  "Tell us about a time you helped a group move forward.",
  "Describe a challenge that changed the way you approach a problem.",
  "What would you bring to a university community?",
];
const summary = {
  summary:
    "Your recent practice is becoming more specific. Your strongest responses connect a clear action to a thoughtful lesson.",
  strengths: ["Concrete personal examples", "A clear sense of responsibility"],
  focusAreas: [
    "Explain outcomes with evidence",
    "Make the reflective closing more concise",
  ],
  actions: [
    "Practise one response with a measurable outcome",
    "Read the model rewrite alongside your own response",
  ],
};
const jobs = [84, 76, 58].map((score, index) => ({
  id: `attempt-${index}`,
  program: index === 0 ? "Waterloo Engineering" : "Queen’s Commerce",
  program_code: index === 0 ? "waterloo_eng" : "queens_comm",
  university: index === 0 ? "University of Waterloo" : "Queen’s University",
  question: questions[index],
  answer:
    "I helped our team organize a difficult project by listening to everyone, splitting up the work and checking our progress. We finished on time and learned to ask for help earlier.",
  status: "done",
  score,
  verdict: feedback.verdict,
  strengths: feedback.strengths,
  fixes: feedback.fixes,
  rewrite: feedback.rewrite,
  created_at: new Date(now - index * 9 * 86400000).toISOString(),
}));

async function fixtureContext(
  browser,
  {
    signedIn = true,
    viewport = { width: 1440, height: 1000 },
    reducedMotion = "no-preference",
  } = {},
) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    locale: "en-CA",
    timezoneId: "America/Toronto",
  });
  const state = {
    authStatus: 200,
    jobsStatus: 200,
    interviewStatus: 200,
    ecStatus: 200,
    summaryStatus: 200,
    analyticsStatus: 200,
    queued: false,
    deleted: false,
    requests: [],
    blockedExternal: [],
    pageErrors: [],
    pageErrorDetails: [],
    consoleErrors: [],
  };
  if (signedIn)
    await context.addInitScript(
      ({ session }) => {
        if (
          location.hostname !== "127.0.0.1" &&
          location.hostname !== "localhost"
        )
          return;
        if (!sessionStorage.getItem("accepted-fixture-initialized")) {
          localStorage.setItem(
            "sb-accepted-test-auth-token",
            JSON.stringify(session),
          );
          sessionStorage.setItem("accepted-fixture-initialized", "yes");
        }
      },
      { session },
    );
  context.on("page", (page) => {
    page.on("pageerror", (error) => {
      state.pageErrors.push(error.message);
      state.pageErrorDetails.push({
        url: page.url(),
        viewport: page.viewportSize(),
        stack: error.stack,
      });
    });
    page.on("console", (message) => {
      if (message.type() === "error") state.consoleErrors.push(message.text());
    });
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (url.hostname === "accepted-test.supabase.co") {
      state.requests.push({
        path: url.pathname,
        method: request.method(),
        body: request.postDataJSON(),
      });
      if (url.pathname.endsWith("/token"))
        return state.authStatus === 200
          ? json(session)
          : json(
              {
                msg: "Invalid login credentials",
                error_code: "invalid_credentials",
              },
              state.authStatus,
            );
      if (url.pathname.endsWith("/signup")) return json({ user });
      if (url.pathname.endsWith("/user")) return json({ ...user });
      if (url.pathname.endsWith("/logout"))
        return route.fulfill({ status: 204 });
      if (url.pathname.endsWith("/recover")) return json({});
      return json({});
    }
    if (url.pathname.startsWith("/api/")) {
      const body = request.postDataJSON();
      state.requests.push({
        path: url.pathname,
        method: request.method(),
        body,
        authorization: Boolean(request.headers()["authorization"]),
      });
      const quota = { used: 3, limit: 10, resetAt: "2026-11-09T00:00:00.000Z" };
      if (url.pathname === "/api/jobs") {
        if (state.jobsHold) await state.jobsHold;
        if (state.jobsStatus !== 200)
          return json(
            {
              error:
                state.jobsStatus === 429
                  ? "You have used all 10 free evaluations for today. Come back tomorrow."
                  : "Could not score this answer. Please try again.",
              quota,
            },
            state.jobsStatus,
          );
        return json(
          state.queued
            ? { id: "recovery-job", status: "queued", position: 1 }
            : { id: "fixture-job", status: "done", ...feedback, quota },
        );
      }
      if (url.pathname.startsWith("/api/jobs/"))
        return json({ status: "done", ...feedback });
      if (url.pathname === "/api/interview") {
        if (state.interviewStatus !== 200)
          return json(
            { error: "Could not prepare your interview. Please try again." },
            state.interviewStatus,
          );
        return json(body.action === "start" ? { questions } : review);
      }
      if (url.pathname === "/api/ec") {
        if (state.ecStatus !== 200)
          return json(
            { error: "Could not review your activities. Please try again." },
            state.ecStatus,
          );
        return json({
          summary:
            "Your activities show sustained involvement and a growing sense of responsibility. Bring the impact into focus.",
          overallLevel: "strong",
          ranked: body.ecs.map((ec, index) => ({
            name: ec.name,
            tier: index === 0 ? "strong" : "solid",
            why: "Sustained involvement and a clear role give this experience substance.",
            leverage: "Use a specific example of a change you helped make.",
          })),
          gaps: ["Add evidence of the outcomes you describe."],
        });
      }
      if (url.pathname === "/api/analytics") {
        if (request.method() === "DELETE") {
          state.deleted = true;
          return json({ ok: true });
        }
        if (state.analyticsStatus !== 200)
          return json(
            { error: "Could not load your history." },
            state.analyticsStatus,
          );
        return json({ jobs: state.deleted ? [] : jobs });
      }
      if (url.pathname === "/api/summary") {
        if (state.summaryStatus !== 200)
          return json(
            { error: "Your summary limit is reached. Try again later." },
            state.summaryStatus,
          );
        return json(summary);
      }
      throw new Error(
        `Unexpected API request: ${request.method()} ${url.pathname}`,
      );
    }
    if (
      url.pathname.startsWith("/_vercel/") ||
      url.hostname === "va.vercel-scripts.com"
    )
      return route.fulfill({
        contentType: "application/javascript",
        body: "/* telemetry transport stubbed for browser tests */",
      });
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost")
      return route.continue();
    state.blockedExternal.push(url.hostname);
    return route.abort("blockedbyclient");
  });
  return { context, state, page: await context.newPage() };
}
module.exports = { fixtureContext, feedback, review, questions, user, session };
