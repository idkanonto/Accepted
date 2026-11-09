# Frontend redesign verification

The redesign uses only `interface-design` and `vercel-react-best-practices`.
No security, SEO, AI evaluation, or other skill was activated. Native browser
checks use ordinary Playwright tooling, not an additional skill.

## Boundaries

- All seven product routes plus `/login` are implemented. Loading, error, not-found,
  signed-out, signed-in and native-dialog states share the new design system.
- API handlers, Supabase helpers/migrations, Groq models/prompts, quotas, rate
  limits, program/prompt data, analytics calculations and storage schemas remain
  unchanged. Vercel Analytics, Speed Insights and funnel event calls remain.
- The previous self-hosted-font fix is retained, with its original license notices.
  No runtime, UI, chart, animation or application dependency was added or upgraded.
- The backend security pass remains separate. No backend investigation or
  exploitation was performed, and no new backend finding was recorded here.

## Browser regression tests

Run `node --test tests/frontend.test.cjs` with Playwright and Chromium available.
They are provided by the Cloud execution image. `CHROMIUM_PATH` and
`FRONTEND_BASE_URL` can select another installed Chromium or local app port.

The tests need a build configured with these **synthetic public test values**:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://accepted-test.supabase.co \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_frontend_test \
NEXT_TELEMETRY_DISABLED=1 npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Then, in another Cloud terminal:

```sh
AXE_SCRIPT=/path/to/verified/axe.min.js node --test tests/frontend.test.cjs
```

Use the actual deployment environment for a normal production build. The test
values are never saved to `.env` or a service configuration. All Supabase/auth and
application API responses are intercepted in the browser; fixtures cannot call
Groq, upload microphone audio or forward application data. Telemetry transports
are stubbed only in tests; the application's analytics implementation is retained.
No live account, database or model-provider behavior is claimed by these tests.

Coverage includes:

- Sign-in success/failure, sign-up confirmation, password reset, sign-out, gated
  tools and native-dialog Escape/focus return.
- Program additions/removals, average and checklist persistence, keyboard tabs,
  historical search/filter/sort, vault filters and program-to-practice navigation.
- Written 60s/10min and video 30s/2min timers, minimum answer length, both upper
  limits, exact submission payloads, loading/results, restored drafts, recovery
  polling and quota errors. Timer expiry submits once rather than repeatedly
  retrying a rejected answer.
- Interview keyboard fallback, all questions, transcript submission, explicit
  microphone requests, listening/stop/permission-denied states and coaching.
- Eight-activity maximum, activity validation/removal, hours conversion, draft
  persistence, ranking, level integration with Planner/Programs and failure retry.
- Analytics retrieval and retry, individual response review, summary/quota states,
  deletion confirmation/cancellation, empty history and structured feedback.
- Eight routes at 1440, 1280, 834, 390 and 360px; mobile active sessions/results;
  reduced-motion behavior and accessible control names.

The accessibility run uses checksum-verified axe-core 4.10.3, injected into the
local browser only. Its WCAG 2/2.1/2.2 AA rules check all eight routes and the auth
dialog. A missing `AXE_SCRIPT` is explicitly reported as a skipped check, not a
pass. The recorded run supplies it and executes the checks.

## Screenshots and evidence

See [the screenshot gallery](SCREENSHOTS.md). Signed-in screenshots use clearly
synthetic test records. Homepage statistics and program references retain their
existing application data; no admission outcome or testimonial was invented.

Machine-readable results are in `screenshots/responsive-results.json` and
`screenshots/accessibility-results.json`. They record actual executed cases.

## Recorded results — November 8, 2026 (America/New_York)

- Production-build browser suite: **15 passed, 0 failed, 0 skipped**. Auth and
  service responses were fixtures; no live Supabase/Groq calls were made.
- Responsive matrix: **40 passed** (eight routes at five widths), with no
  horizontal overflow, uncaught browser errors or normal-route console errors.
- Accessibility: **zero axe violations** across all eight routes and the auth
  dialog. Keyboard tabs, modal focus/Escape, labeled fields and reduced motion
  are also covered by behavioral checks.
- **31 screenshots** include desktop/mobile routes, signed-out forms, dialogs,
  populated planning, active practice and all coaching result screens.
- Standalone `tsc --noEmit`: **passed**.
- Normal `npm run build`, without synthetic public-variable overrides:
  **passed**. Fonts are bundled locally; Google Fonts access is unnecessary.
- A smoke check of that normal build visits all eight routes and the custom 404,
  verifies signed-out access gates and graceful unconfigured sign-in errors,
  and confirms all three local font assets return HTTP 200. No uncaught browser
  errors or external application requests occur; telemetry transport is stubbed
  for this check.
- All **28 protected-file hashes match** the starting baseline. A separate diff
  confirms API handlers, Supabase, all `lib` files, environment examples, Next
  configuration, application dependencies/lockfile, historical data and Vercel
  tracking components are unchanged.

The shell is server-rendered with an explicit Suspense boundary around streamed
route content. Auth-dependent UI preserves its first loading render while it
hydrates. The final browser suite and separate 40-case regression both pass
without hydration errors; no hydration warnings are suppressed.

No unresolved frontend defect was found in the tested states. Live authentication,
provider responses and browser-provider speech transcription still need the
connection settings and checks in
[BACKEND_CONNECTION_CHECKLIST.md](../BACKEND_CONNECTION_CHECKLIST.md).

## Existing lint setup

`CI=1 npm run lint < /dev/null` exits 1 at Next's initial ESLint configuration
prompt. The repository has no ESLint configuration or dependency; no lint pass
is claimed. Build/type checking and the browser tests run independently. No
framework, lockfile or dependency change was made to hide this pre-existing gap.
