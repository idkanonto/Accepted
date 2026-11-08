/* Run through playwright-cli run-code --filename=docs/qa/browser-checks.js.
 * LOCAL QA ONLY: all auth, API and analytics requests are intercepted.
 * The dev server uses synthetic public Supabase settings; no real credentials.
 */
async (page) => {
  const base = 'http://localhost:3000';
  const output = '/workspace/Accepted/docs/screenshots';
  const results = [];
  const requests = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(page.url() + ': ' + error.message));
  const assert = (condition, label) => {
    if (!condition) throw new Error(label);
    results.push(label);
  };
  const visible = async (locator, label) => {
    await locator.first().waitFor({ state: 'visible' });
    assert(true, label);
  };
  const shot = async (name, fullPage = true) => {
    await page.screenshot({ path: `${output}/${name}.png`, fullPage, caret: 'initial' });
  };
  const user = {
    id: '00000000-0000-4000-8000-000000000042',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'aleksandra.applicant@example.test',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: '2026-01-01T00:00:00Z',
  };
  const jwt =
    btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) +
    '.' +
    btoa(
      JSON.stringify({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
      })
    ) +
    '.local-qa-only';
  const session = {
    access_token: jwt,
    refresh_token: 'qa-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
  const feedback = {
    score: 82,
    verdict:
      'A thoughtful response with a clear example. Be more specific about what you learned and how you would apply it.',
    strengths: [
      'A credible example with a clear role.',
      'You explain how your actions helped the team.',
    ],
    fixes: ['Make the outcome more concrete.', 'Connect your reflection to a future action.'],
    rewrite:
      'When our robotics team lost access to its usual workspace, I helped reorganise the build schedule and documented the remaining tasks. I learned that a clear shared plan matters most when the team has to adapt.',
  };
  const questions = [
    'Tell us about a time you helped a team work through uncertainty.',
    'Describe a challenge that changed the way you learn.',
    'How would you contribute to your university community?',
  ];
  const review = {
    overallScore: 78,
    overallAssessment:
      'Your examples show responsibility and reflection. Keep the focus on your own decisions and use one specific outcome in each answer.',
    dimensions: [
      {
        name: 'Clarity & structure',
        score: 81,
        evidence: 'The response follows a clear situation, action and outcome.',
        coaching: 'Give the outcome a little more space.',
      },
      {
        name: 'Reflection & growth',
        score: 75,
        evidence: 'You identify a lesson from the experience.',
        coaching: 'Explain how you would use that lesson next time.',
      },
    ],
    nextSteps: [
      'Choose a specific example before you start.',
      'Practise a concise explanation of the outcome.',
    ],
  };
  let analyticsMode = 'demo';
  let historyMode = 'demo';
  let jobsMode = 'done';
  let ecMode = 'demo';
  let interviewMode = 'demo';
  let heldRequest = null;
  const longProgram =
    'Joint Honours Computer Science, Mathematics and Interdisciplinary Environmental Engineering';
  const longText =
    'I worked with students from different backgrounds to coordinate an accessible community science exhibition, document our decisions, and reflect on how we could make the next project more inclusive. ';
  const jobs = Array.from({ length: 8 }, (_, i) => ({
    id: `qa-${i}`,
    program: i % 2 ? 'Waterloo Computer Science' : 'Queen’s Smith Commerce',
    program_code: i % 2 ? 'waterloo_cs' : 'queens_comm',
    university: i % 2 ? 'University of Waterloo' : 'Queen’s University',
    question: questions[i % 3],
    answer: longText,
    status: 'done',
    score: 68 + i * 3,
    verdict: feedback.verdict,
    strengths: feedback.strengths,
    fixes: feedback.fixes,
    rewrite: feedback.rewrite,
    created_at: new Date(Date.now() - i * 6 * 86400000).toISOString(),
  }));
  await page.route('**/*', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname === 'accepted-qa.supabase.co') {
      requests.push({
        path: url.pathname,
        method: request.method(),
        data: request.postDataJSON?.(),
      });
      if (url.pathname.endsWith('/user')) return route.fulfill({ json: user });
      if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
      if (url.pathname.endsWith('/recover')) return route.fulfill({ json: {} });
      if (url.pathname.endsWith('/signup')) return route.fulfill({ json: { user, session: null } });
      return route.fulfill({
        status: 400,
        json: { code: 'invalid_credentials', message: 'QA: Email or password was not recognised.' },
      });
    }
    if (url.hostname !== 'localhost') return route.abort();
    if (url.pathname.startsWith('/_vercel/')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (url.pathname === '/history.json' && historyMode !== 'demo') {
      if (historyMode === 'error') return route.fulfill({ status: 503, json: {} });
      if (historyMode === 'loading') {
        heldRequest = route;
        return;
      }
      const count = historyMode === 'empty' ? 0 : historyMode === 'one' ? 1 : 1000;
      return route.fulfill({
        json: {
          totalOffers: count * 5,
          overallAverage: 92.5,
          programCount: count,
          programs: Array.from({ length: count }, (_, i) => ({
            university: i % 2 ? 'University of Toronto' : 'University of Waterloo',
            program: i === 0 ? longProgram : `Honours Science ${i + 1}`,
            offers: i === 0 ? 1 : 12,
            average: 92.5,
            median: 93,
            low: 86,
            high: 99,
            byYear: [{ year: 2025, average: 92.5, offers: 5 }],
          })),
        },
      });
    }
    if (url.pathname.startsWith('/api/')) {
      const data = request.method() === 'POST' ? request.postDataJSON() : null;
      requests.push({ path: url.pathname, method: request.method(), data });
      if (url.pathname === '/api/track') return route.fulfill({ json: { ok: true } });
      if (url.pathname === '/api/analytics') {
        if (request.method() === 'DELETE') return route.fulfill({ json: { ok: true } });
        if (analyticsMode === 'error')
          return route.fulfill({
            status: 503,
            json: { error: 'QA: Your history could not be loaded. Please try again.' },
          });
        if (analyticsMode === 'loading') {
          heldRequest = route;
          return;
        }
        const items =
          analyticsMode === 'empty'
            ? []
            : analyticsMode === 'one'
              ? jobs.slice(0, 1)
              : analyticsMode === 'worst'
                ? Array.from({ length: 1000 }, (_, i) => ({
                    ...jobs[i % 8],
                    id: `qa-big-${i}`,
                    program: i % 2 ? longProgram : '王秀英 — Community Leadership',
                    question: i === 0 ? longText.repeat(8) : questions[i % 3],
                    score: i % 3 === 0 ? null : i % 3 === 1 ? 0 : 100,
                  }))
                : jobs;
        return route.fulfill({ json: { jobs: items } });
      }
      if (url.pathname === '/api/summary')
        return route.fulfill({
          json: {
            summary:
              'Your recent practice is becoming more structured. Keep using specific evidence and make your reflection more concrete.',
            strengths: ['A clear sequence of events.', 'Credible, personal examples.'],
            focusAreas: ['Explain the result of your actions.'],
            actions: ['Choose one response and rewrite its final reflection.'],
          },
        });
      if (url.pathname === '/api/jobs' && request.method() === 'POST') {
        if (jobsMode === 'quota')
          return route.fulfill({
            status: 429,
            json: {
              error: 'QA: Your free daily feedback limit is reached. Your draft is still here.',
              quota: { used: 5, limit: 5 },
            },
          });
        if (jobsMode === 'network') return route.abort();
        if (jobsMode === 'waiting')
          return route.fulfill({ json: { id: 'qa-queued', position: 2 } });
        return route.fulfill({
          json: {
            status: 'done',
            ...feedback,
            quota: { used: 1, limit: 5, resetAt: new Date(Date.now() + 86400000).toISOString() },
          },
        });
      }
      if (url.pathname.startsWith('/api/jobs/'))
        return route.fulfill({
          json:
            jobsMode === 'waiting'
              ? { status: 'queued', position: 2, capReached: true }
              : { status: 'done', ...feedback },
        });
      if (url.pathname === '/api/interview') {
        if (interviewMode === 'error')
          return route.fulfill({
            status: 503,
            json: { error: 'QA: Could not prepare your interview. Please try again.' },
          });
        return route.fulfill({ json: data.action === 'start' ? { questions } : review });
      }
      if (url.pathname === '/api/ec') {
        if (ecMode === 'error') return route.abort();
        return route.fulfill({
          json: {
            summary:
              ecMode === 'worst'
                ? longText.repeat(5)
                : 'Your activities show sustained responsibility. Keep making the impact of your contribution specific.',
            overallLevel: 'strong',
            ranked: (data.ecs || []).map((ec, i) => ({
              name: ec.name,
              tier: i === 0 ? 'strong' : 'solid',
              why:
                ecMode === 'worst'
                  ? longText.repeat(3)
                  : 'You describe consistent involvement and a meaningful role.',
              leverage: 'Give one example of a change that happened because of your work.',
            })),
            gaps: ['Explain your individual contribution and include a concrete outcome.'],
          },
        });
      }
      return route.fulfill({ json: {} });
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
  });
  const goto = async (path) => {
    await page.goto(base + path);
    await page.locator('main').waitFor();
    await page
      .getByRole('button', { name: /^Sign in$|^Sign out$/ })
      .first()
      .waitFor();
  };
  const signIn = async () => {
    await page.evaluate(
      (s) => localStorage.setItem('sb-accepted-qa-auth-token', JSON.stringify(s)),
      session
    );
    await page.reload();
    await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
  };
  const overflow = async (label) => {
    const state = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert(
      state.scroll <= state.width + 1,
      `${label}: no page overflow (${state.scroll}/${state.width})`
    );
  };

  page.setDefaultTimeout(20000);
  try {
    // Guest routes, modal focus containment and validation.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
    await shot('after-home');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await visible(dialog, 'Authentication dialog opens');
    await assert(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
      'Dialog receives focus'
    );
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    assert(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
      'Dialog contains keyboard focus'
    );
    await dialog.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    assert(
      await page.locator('#auth-email').evaluate((el) => !el.validity.valid),
      'Empty email uses native validation'
    );
    await page.locator('#auth-email').fill('aleksandra.applicant@example.test');
    await page.locator('#auth-password').fill('example-password');
    await dialog.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await visible(page.getByRole('alert').filter({ hasText: 'QA:' }), 'Sign-in error is visible');
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await visible(
      page.getByText('If that account exists, a reset link is on its way.'),
      'Password reset confirmation'
    );
    await page.getByRole('button', { name: 'Create account', exact: true }).first().click();
    await dialog.getByRole('button', { name: 'Create account', exact: true }).last().click();
    await visible(
      page.getByText('Account created — check your inbox for a confirmation link.'),
      'Sign-up confirmation'
    );
    await shot('after-auth-dialog');
    await page.keyboard.press('Escape');
    assert(!(await dialog.isVisible()), 'Escape closes authentication');
    assert(
      await page
        .getByRole('button', { name: 'Sign in', exact: true })
        .evaluate((el) => el === document.activeElement),
      'Focus returns to sign-in trigger'
    );
    for (const route of ['/simulator', '/interview', '/ec-rater', '/analytics']) {
      await goto(route);
      await visible(
        page.getByRole('button', { name: 'Sign up or sign in' }),
        `${route}: signed-out gate retained`
      );
    }
    await goto('/login');
    await visible(page.locator('#auth-email'), 'Dedicated login route');
    await shot('after-login');

    // Vault selection, search, zero/one result states and preserved deep links.
    await goto('/vault');
    await page.getByRole('button', { name: '01 Waterloo' }).waitFor();
    await shot('after-vault');
    await page.getByRole('button', { name: '02 U of T' }).click();
    await visible(
      page.getByRole('heading', { name: 'University of Toronto', exact: true }),
      'University filter'
    );
    await page.getByRole('button', { name: '01 Waterloo' }).click();
    await page.getByRole('searchbox').fill('Computing and Financial');
    assert((await page.locator('tbody tr').count()) === 1, 'Vault search returns one program');
    assert(
      (await page.locator('tbody a').first().getAttribute('href')).includes('program=waterloo_cs'),
      'Practice link preserves program code'
    );
    await page.getByRole('searchbox').fill('InterdisciplinaryEnvironmentalSystemsLeadership');
    await visible(
      page.getByRole('heading', { name: 'No programs found.' }),
      'Vault zero-result state'
    );
    await page.getByRole('button', { name: 'Clear search' }).click();

    // Planner mutations only write to browser storage.
    await goto('/planner');
    await page.locator('#planner-program').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Add program', exact: true }).click();
    await visible(
      page.getByRole('heading', { name: 'Computer Science (BCS)', exact: true }),
      'Planner adds a program'
    );
    assert(
      await page.getByRole('button', { name: 'Add program', exact: true }).isDisabled(),
      'Planner prevents duplicate selection'
    );
    await page.locator('#current-average').fill('94');
    await page.getByRole('button', { name: 'Confirm each program and campus on OUAC' }).click();
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#current-average').length === 1);
    await visible(
      page.getByRole('heading', { name: 'Computer Science (BCS)', exact: true }),
      'Shortlist survives reload'
    );
    assert(
      (await page.locator('#current-average').inputValue()) === '94',
      'Average survives reload'
    );
    assert(
      (await page
        .getByRole('button', { name: 'Confirm each program and campus on OUAC' })
        .getAttribute('aria-pressed')) === 'true',
      'Checklist survives reload'
    );
    await shot('after-planner');
    await goto('/vault');
    await visible(page.getByText('Your saved average: 94%'), 'Vault reads planner average');
    assert(
      (await page.getByRole('img', { name: /your average 94%/ }).count()) > 0,
      'Range markers retained'
    );
    await goto('/planner');
    await page.getByRole('button', { name: 'Historical averages', exact: true }).click();
    await page.getByRole('button', { name: 'Sort by average' }).waitFor();
    await page.getByRole('button', { name: 'Sort by program' }).focus();
    await page.keyboard.press('Enter');
    assert(
      (await page.locator('th[aria-sort="ascending"]').count()) === 1,
      'History sorting works by keyboard'
    );
    await page.getByRole('textbox', { name: 'Search programs and universities' }).fill('Computer');
    assert((await page.locator('tbody tr').count()) > 0, 'Historical search');
    await page.getByRole('combobox', { name: 'Filter by university' }).selectOption({ index: 1 });
    await page
      .getByRole('textbox', { name: 'Search programs and universities' })
      .fill('NoSuchProgram');
    await visible(
      page.getByRole('heading', { name: 'No matching records.' }),
      'Historical zero-result state'
    );
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await shot('after-history', false);

    // Synthetic authenticated user, no real authentication service.
    await signIn();
    await goto('/simulator?program=waterloo_cs');
    await visible(
      page.getByRole('button', { name: 'Start timed simulation' }),
      'Simulator authenticated setup'
    );
    assert(
      (await page.locator('#sim-program').inputValue()) === 'waterloo_cs',
      'Simulator consumes program deep link'
    );
    await shot('after-simulator');
    await page.getByRole('button', { name: 'Start timed simulation' }).click();
    await visible(page.getByText('Preparation time', { exact: true }), 'Preparation timer starts');
    const timerBefore = await page.getByRole('timer').textContent();
    await page.waitForTimeout(1150);
    assert(
      (await page.getByRole('timer').textContent()) !== timerBefore,
      'Preparation timer counts down'
    );
    await page.getByRole('button', { name: 'Start response now' }).click();
    await page.locator('#sim-answer').fill('short');
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'sentence or two' }),
      'Written minimum-length validation'
    );
    await page.locator('#sim-answer').fill(longText);
    await page.reload();
    await page.locator('#sim-answer').waitFor();
    assert(
      (await page.locator('#sim-answer').inputValue()) === longText,
      'Simulator draft recovers after reload'
    );
    await page.locator('#sim-answer').fill('experience '.repeat(501));
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(
      page.getByText('Over the limit — trim before submitting.'),
      'Word limit presentation retained'
    );
    await page.locator('#sim-answer').fill(longText);
    jobsMode = 'quota';
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'daily feedback limit' }),
      'Quota error retains draft'
    );
    jobsMode = 'network';
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'Network error' }),
      'Simulator network error'
    );
    jobsMode = 'done';
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(
      page.getByText('Nova’s evaluation').or(page.getByText("Nova's evaluation")),
      'Simulator feedback result'
    );
    await visible(page.getByText('1 of 5 free evaluations used today'), 'Quota indicator retained');
    await shot('after-simulator-feedback');
    const submission = requests.filter((r) => r.path === '/api/jobs' && r.method === 'POST').at(-1);
    assert(
      submission.data.programCode === 'waterloo_cs' &&
        submission.data.answer === longText.trim() &&
        submission.data.format === 'written',
      'Original evaluation payload preserved'
    );
    await page.getByRole('button', { name: 'Try another', exact: true }).click();
    await page.locator('#sim-type').selectOption('video');
    await page.getByRole('button', { name: 'Start timed simulation' }).click();
    await page.getByRole('button', { name: 'Start response now' }).click();
    await visible(
      page.getByText(/This timer does not record audio/),
      'Video timer retains non-recording disclosure'
    );
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await visible(
      page.getByRole('heading', { name: 'Simulation completed' }),
      'Video completion state'
    );

    // Expired prep → response, expired response → short-answer validation, queue recovery.
    const draftKey = `accepted-simulator-draft:${user.id}`;
    await page.evaluate(
      ({ key }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            programCode: 'queens_comm',
            format: 'written',
            phase: 'prep',
            timeLeft: 1,
            prompt: 'Describe a time you adapted your plan.',
            answer: '',
            feedback: null,
            jobId: null,
          })
        ),
      { key: draftKey }
    );
    await page.reload();
    await visible(
      page.getByText('Writing window', { exact: true }),
      'Prep timer progresses to response'
    );
    await page.evaluate(
      ({ key }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            programCode: 'queens_comm',
            format: 'written',
            phase: 'response',
            timeLeft: 1,
            prompt: 'Describe a time you adapted your plan.',
            answer: '',
            feedback: null,
            jobId: null,
          })
        ),
      { key: draftKey }
    );
    await page.reload();
    await visible(
      page.getByRole('alert').filter({ hasText: 'Time is up' }),
      'Time-up validation retained'
    );
    jobsMode = 'waiting';
    await page.locator('#sim-answer').fill(longText);
    await page.getByRole('button', { name: 'Finish & get feedback' }).click();
    await visible(page.getByRole('heading', { name: /Queued/ }), 'Queued evaluation state');
    await visible(
      page.getByText(/Today’s free scoring limit is reached/),
      'Queue daily-cap disclosure'
    );
    await page.reload();
    await visible(page.getByRole('heading', { name: /Queued/ }), 'Queue recovers after reload');
    jobsMode = 'done';
    await visible(page.getByText("Nova's evaluation"), 'Queue polling completes');

    // Voice fallback and typed interview flow. All questions/reviews are mocks.
    await goto('/interview');
    await page.getByRole('button', { name: 'Start mock interview' }).waitFor();
    await shot('after-interview');
    interviewMode = 'error';
    await page.getByRole('button', { name: 'Start mock interview' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'Could not prepare' }),
      'Interview start error'
    );
    interviewMode = 'demo';
    await page.getByRole('button', { name: 'Start mock interview' }).click();
    await page.getByRole('button', { name: 'Answer by voice' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'Speech-to-text is not available' }),
      'Speech unavailable typed fallback'
    );
    await page.getByRole('button', { name: 'Next question' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'complete response' }),
      'Interview minimum response validation'
    );
    for (let i = 0; i < 3; i++) {
      await page.locator('#interview-answer').fill(longText);
      await page
        .getByRole('button', { name: i === 2 ? 'Finish and review' : 'Next question' })
        .click();
    }
    await visible(
      page.getByRole('heading', { name: 'A clear next step.' }),
      'Three-question interview review'
    );
    await shot('after-interview-review');
    assert(
      requests.some(
        (r) =>
          r.path === '/api/interview' && r.data?.action === 'analyze' && r.data.answers.length === 3
      ),
      'Interview analysis payload retained'
    );
    await page.getByRole('button', { name: 'Start another round' }).click();
    await visible(page.getByRole('button', { name: 'Start mock interview' }), 'Interview reset');

    // Activity fields, limits, draft persistence and ranking.
    await goto('/ec-rater');
    await page.getByRole('button', { name: 'Rank my ECs' }).waitFor();
    await shot('after-ec-rater');
    await page.getByRole('button', { name: 'Rank my ECs' }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'every activity a name' }),
      'Activity name validation'
    );
    await page
      .getByRole('textbox', { name: 'Activity name', exact: true })
      .fill('Community Robotics & Environmental Science Outreach');
    await page
      .getByRole('textbox', { name: 'Your role', exact: true })
      .fill('Co-founder & workshop coordinator');
    await page.getByRole('textbox', { name: 'How long', exact: true }).fill('2 years');
    await page.getByRole('textbox', { name: 'Hours per week', exact: true }).fill('123abc');
    assert(
      (await page.getByRole('textbox', { name: 'Hours per week', exact: true }).inputValue()) ===
        '12',
      'Activity numeric input limit'
    );
    await page
      .getByRole('textbox', { name: 'What you did and what changed', exact: true })
      .fill(longText.repeat(3).slice(0, 600));
    await page.reload();
    await page.getByRole('button', { name: 'Rank my ECs' }).waitFor();
    assert(
      (
        await page.getByRole('textbox', { name: 'Activity name', exact: true }).inputValue()
      ).includes('Community Robotics'),
      'Activity draft persists'
    );
    for (let i = 1; i < 8; i++)
      await page.getByRole('button', { name: 'Add another activity' }).click();
    assert(
      !(await page.getByRole('button', { name: 'Add another activity' }).count()),
      'Eight-activity maximum retained'
    );
    for (let i = 8; i > 1; i--)
      await page.getByRole('button', { name: `Remove activity ${i}`, exact: true }).click();
    ecMode = 'error';
    await page.getByRole('button', { name: 'Rank my ECs' }).click();
    await visible(page.getByRole('alert').filter({ hasText: 'Network error' }), 'EC network error');
    ecMode = 'worst';
    await page.getByRole('button', { name: 'Rank my ECs' }).click();
    await visible(page.getByText('Overall: strong'), 'Activity ranking');
    await shot('after-ec-feedback');
    assert(
      (await page.evaluate(
        () => JSON.parse(localStorage.getItem('accepted-ec-profile-v1') || 'null')?.level
      )) === 'strong' ||
        (await page.evaluate(() =>
          Object.keys(localStorage).some((k) => localStorage.getItem(k) === '{"level":"strong"}')
        )),
      'EC level persists for planner'
    );

    // Analytics: demo, empty, one, 1000, error, loading, summary, cancel/confirm deletion.
    analyticsMode = 'demo';
    await goto('/analytics');
    await page.getByRole('heading', { name: 'Recent attempts' }).waitFor();
    await shot('after-analytics');
    await page.getByRole('button', { name: 'Ask Nova for a breakdown' }).click();
    await visible(page.getByRole('heading', { name: 'Nova’s perspective' }), 'Nova summary');
    await page.getByRole('button', { name: 'Clear practice history' }).click();
    await visible(page.getByRole('dialog'), 'Clear-history confirmation');
    const deletesBefore = requests.filter((r) => r.method === 'DELETE').length;
    await page.getByRole('button', { name: 'Keep my history' }).click();
    assert(
      requests.filter((r) => r.method === 'DELETE').length === deletesBefore,
      'Cancel clear sends no deletion'
    );
    await page.getByRole('button', { name: 'Clear practice history' }).click();
    await page.getByRole('button', { name: 'Clear history', exact: true }).click();
    await visible(
      page.getByRole('heading', { name: 'Your progress starts with one response.' }),
      'Clear-history result'
    );
    analyticsMode = 'error';
    await page.reload();
    await visible(
      page.getByRole('alert').filter({ hasText: 'history could not be loaded' }),
      'Analytics load error visible'
    );
    analyticsMode = 'demo';
    await page.getByRole('button', { name: 'Try loading again' }).click();
    await visible(page.getByRole('heading', { name: 'Recent attempts' }), 'Analytics retry');
    analyticsMode = 'one';
    await page.reload();
    await visible(page.getByText('1 attempt', { exact: true }), 'Single attempt pluralisation');
    analyticsMode = 'empty';
    await page.reload();
    await visible(
      page.getByRole('heading', { name: 'Your progress starts with one response.' }),
      'Analytics empty state'
    );
    analyticsMode = 'loading';
    await page.reload();
    await visible(
      page.getByRole('status').filter({ hasText: 'Loading your practice record' }),
      'Analytics loading state'
    );
    analyticsMode = 'worst';
    await heldRequest.fulfill({ json: { jobs } });
    heldRequest = null;
    await page.reload();
    await visible(
      page.getByRole('heading', { name: 'Recent attempts' }),
      'Large analytics dataset'
    );
    await shot('after-analytics-worst');

    // Full route coverage at desktop, tablet, mobile and 320px. Signed-in tools.
    analyticsMode = 'demo';
    ecMode = 'demo';
    jobsMode = 'done';
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const route of [
        '/',
        '/vault',
        '/planner',
        '/simulator',
        '/interview',
        '/ec-rater',
        '/analytics',
        '/login',
        '/not-a-page',
      ]) {
        await goto(route);
        await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
        await overflow(`${route} at ${width}px`);
        if (
          width === 390 &&
          [
            '/',
            '/vault',
            '/planner',
            '/simulator',
            '/interview',
            '/ec-rater',
            '/analytics',
            '/login',
          ].includes(route)
        )
          await shot(`after-${route === '/' ? 'home' : route.slice(1)}-mobile`);
      }
    }
    await page.getByRole('button', { name: 'More tools' }).click();
    await visible(page.getByRole('dialog'), 'Mobile tool menu');
    for (let i = 0; i < 16; i++) await page.keyboard.press('Tab');
    assert(
      await page.getByRole('dialog').evaluate((el) => el.contains(document.activeElement)),
      'Mobile menu traps keyboard focus'
    );
    await page
      .getByRole('navigation', { name: 'All tools' })
      .getByRole('link', { name: 'Mock Interview', exact: true })
      .click();
    await visible(
      page.getByRole('button', { name: 'Start mock interview' }),
      'Mobile tool navigation'
    );
    assert(!(await page.getByRole('dialog').isVisible()), 'Navigation closes mobile menu');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.keyboard.press('Escape');
    assert(!(await page.getByRole('dialog').isVisible()), 'Escape closes mobile menu');

    // Narrow worst-case content, 1000 historical records, 200% root text, reduced motion.
    await goto('/ec-rater');
    await page.getByRole('button', { name: 'Rank my ECs' }).waitFor();
    await page
      .getByRole('textbox', { name: 'Activity name', exact: true })
      .fill('InterdisciplinaryEnvironmentalScienceCommunityOutreachLeadership');
    ecMode = 'worst';
    await page.getByRole('button', { name: 'Rank my ECs' }).click();
    await visible(page.getByText('Overall: strong'), 'Long EC feedback');
    await overflow('Worst-case activity at 320px');
    analyticsMode = 'worst';
    await goto('/analytics');
    await page.getByRole('heading', { name: 'Recent attempts' }).waitFor();
    await overflow('1000 attempts and long titles at 320px');
    await goto('/planner');
    historyMode = 'worst';
    await page.getByRole('button', { name: 'Historical averages', exact: true }).click();
    await page.getByRole('button', { name: 'Sort by average' }).waitFor();
    assert((await page.locator('tbody tr').count()) === 1000, '1000 historical program rows');
    await overflow('1000 historical rows at 320px');
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await overflow('History with 200% text');
    await page.evaluate(() => (document.documentElement.style.fontSize = ''));
    historyMode = 'error';
    await page.reload();
    await page.getByRole('button', { name: 'Historical averages', exact: true }).click();
    await visible(
      page.getByRole('alert').filter({ hasText: 'Could not load the historical averages' }),
      'History network error'
    );
    historyMode = 'demo';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto('/');
    await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
    assert(
      await page
        .locator('.btn-primary')
        .first()
        .evaluate((el) =>
          getComputedStyle(el)
            .transitionDuration.split(',')
            .every((t) => parseFloat(t) < 0.01)
        ),
      'Reduced motion is respected'
    );
    assert(errors.length === 0, `No uncaught page errors: ${errors.join('; ')}`);
    return { passed: results.length, results, mockedRequests: requests.length, errors };
  } catch (error) {
    return { failed: error.message, url: page.url(), passed: results.length, results, errors };
  }
}
