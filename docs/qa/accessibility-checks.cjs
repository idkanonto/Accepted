// Local QA only. Resolve Playwright and axe from external tooling via NODE_PATH.
const { chromium } = require('playwright-core');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const user = {
    id: '00000000-0000-4000-8000-000000000042',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'aleksandra.applicant@example.test',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  };
  const token =
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url',
    ) +
    '.' +
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
      }),
    ).toString('base64url') +
    '.qa';
  const session = {
    access_token: token,
    refresh_token: 'qa-only',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
  await context.addInitScript(
    (session) =>
      localStorage.setItem(
        'sb-accepted-qa-auth-token',
        JSON.stringify(session),
      ),
    session,
  );
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'accepted-qa.supabase.co')
      return route.fulfill({ json: user });
    if (url.hostname !== 'localhost') return route.abort();
    if (url.pathname.startsWith('/_vercel/'))
      return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (url.pathname.startsWith('/api/'))
      return route.fulfill({ json: { jobs: [] } });
    return route.continue();
  });
  const reports = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      '/',
      '/vault',
      '/planner',
      '/simulator',
      '/interview',
      '/ec-rater',
      '/analytics',
      '/login',
      '/does-not-exist',
    ]) {
      await page.goto('http://localhost:3000' + path);
      await page
        .getByRole('button', { name: 'Sign out', exact: true })
        .first()
        .waitFor();
      await page.locator('main h1').waitFor();
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      reports.push({
        width,
        path,
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  fs.writeFileSync(
    'docs/qa/accessibility-results.json',
    JSON.stringify(reports, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        pages: reports.length,
        issues: reports.filter((r) => r.violations.length),
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
