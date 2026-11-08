# Frontend QA and functional parity

Validated 2026-11-08 against the production build of the redesign. Source baseline: main `d75c5baee88b745544fc674534f1aa76ff2f881e`. No production deployment or real user data changes.

## Results

| Check | Result |
| --- | --- |
| `npm run build` | PASS — all application pages compiled and prerendered; API routes remained dynamic |
| `node_modules/.bin/tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| Existing `npm run lint` (also `CI=1` with stdin closed) | NOT CONFIGURED — Next opens the ESLint setup prompt. No ESLint configuration or dependency was added. This is not a lint pass. |
| Existing automated tests | No test script/framework is configured in package.json. The browser checks below were added for meaningful workflow coverage without changing dependencies. |
| Playwright CLI production suite | PASS — 121 assertions; no uncaught page errors in the final run |
| Additional interaction suite | PASS — 14 assertions: synthetic speech, denied microphone, long email, all routes at 200% text |
| Automated accessibility | PASS — zero axe WCAG A/AA violations in 18 views (nine routes at desktop/mobile sizes); this is not a WCAG certification |
| Function preservation | PASS — 57 existing handlers, hooks, constants and derived-data blocks match the baseline after formatting normalization |
| Protected paths | PASS — API, lib/data/business logic, Supabase, auth provider, dependencies, lockfile, environment example, and deployment/build configuration unchanged |

Machine-readable results: [browser](qa/browser-results.json), [accessibility](qa/accessibility-results.json), [preservation](qa/preservation-results.json), and [additional interaction checks](qa/interaction-results.json).

## Functional parity checklist

| Feature | Verified in the browser | Preservation boundary |
| --- | --- | --- |
| Homepage and shell | All destinations, sign-in modal, mobile navigation, route orientation, active state | Existing routes and tracked CTA names/properties retained |
| Program Vault | University selection, search, one/zero matches, clearing search, program practice link, planner-average marker | University/program dataset and search predicates unchanged |
| Planner | Add program, duplicate prevention, average changes, checklist toggle; all survive reload | Same storage key/schema, handlers, academic alignment and EC fit calculations |
| Historical averages | Real supplied dataset loads; search, university filter, keyboard sorting, no results/reset; error; 1,000-row fixture | Same fetch, filtering and sorting; no historical data edits |
| Simulator | Program deep link, prep countdown, prep→response transition, minimum/word limits, timer expiry, written feedback, video disclosure/completion | Same timers, handlers, constraints, program mapping and API payload |
| Drafts, queue and quota | Written draft reload, 429 response, network failure, queued daily-cap notice, queue reload/recovery/completion, quota display | Same owner-specific storage, polling, quota behavior and recovery effects |
| Mock Interview | Program setup, start error, minimum response validation, three typed responses, review, reset, unsupported-speech fallback | All request payloads, recognition code, microphone lifecycle and analysis behavior unchanged |
| EC Rater | Required activity name, numeric hours, draft reload, add up to eight, remove, network error, ranking, saved EC level | All fields, limits, draft keys, request conversions and stored profile behavior unchanged |
| Nova Analytics | Real computeStats runs on fixtures; charts, summary, empty/one/1,000 attempts, loading, errors, retry, clear cancellation and confirmation | Same calculations, history endpoints, summary request and deletion handler |
| Authentication/account | Native required/email validation; mocked sign-in error, sign-up confirmation, reset confirmation; modal focus/return/Escape; signed-in account | Supabase client, provider, sign-in/sign-up/reset/sign-out calls and redirects unchanged |
| Error and missing route | Missing route rendered and checked at all widths; tool network errors exercised | Error reset callback remains; deliberately forcing a React boundary crash was not separately exercised |

The destructive-history confirmation adds a frontend review step. Its confirmed action invokes the original DELETE handler; cancel sends no deletion. QA intercepts this endpoint, so no saved production attempts were removed.

## Responsive and resilience coverage

- All eight user-facing routes plus missing-page recovery at 1440px, 768px, 390px and 320px: no page-level horizontal overflow.
- Text resizing: historical data at 200% root font size and 320px; all eight routes at 200% text in the additional suite.
- Empty lists, single results, long program/activity names, CJK labels, long feedback, nullable/zero/100 scores, 600-character activity detail, eight activities, and 1,000 history/analytics records.
- Narrow tables scroll inside their own container. Vault and recent-attempt records use mobile summaries with their important values visible.
- Keyboard: sign-in focus containment/return, Escape, mobile menu containment/dismissal, sort buttons and native form validation.
- Reduced motion is asserted from computed styles. Device-specific safe-area, browser chrome, touch feel and on-screen keyboard behavior require physical hardware.
- No image fallback scenario applies to application content: this UI uses system type and vector icons, with no external content-image dependency.

## Review findings and final treatment

| Before / finding | After | Why |
| --- | --- | --- |
| Navy/brass theme and equal-weight top navigation | Paper/ink/indigo system with grouped workspace navigation | Gives complex admissions tasks a consistent hierarchy |
| Historical sorting attached to table headers without keyboard controls | Native buttons inside headers with aria-sort | Sorting is keyboard accessible |
| Modal lacked focus containment and Escape behavior | Native top-layer dialog, scroll lock, focus restoration | Keeps keyboard and mobile interactions predictable |
| 12px overflow in narrow homepage header | Compact control spacing and responsive account labels | Actions stay reachable at 320px |
| Header overflow with 200% text | Header controls reflow instead of extending the page | Preserves text resizing and navigation access |
| Low-contrast university indices and muted text on indigo surfaces | Removed index opacity and deepened secondary text token | Meets the automated contrast checks |
| Recent-attempt table hid scores beyond a horizontal scroll on phones | Dedicated mobile record summaries | Date, program, score and prompt stay together |
| No press feedback and coarse one-off control styles | Shared control tokens and short press transforms | Consistent immediate feedback |
| Network font requests | Native platform typography and tabular values | Removes external font requests and font-swap layout shifts |

Motion inventory: dialog entry uses CSS opacity/transform at 180ms; press feedback uses CSS transform at 120ms; loading spinners communicate pending work. Color transitions are short and local. No animation library, full-screen blur, animated layout dimensions, per-frame React state, or speculative will-change layers were introduced. Frame-rate claims would require real-device profiling and are not made here.

## Browser isolation and reproduction

QA used Chromium and the allowed Playwright CLI skill. Browser/formatter/axe tooling was installed under `/tmp/accepted-tools`, outside the application's dependencies. No package or lockfile changes were made.

The local QA build used the synthetic public URL `https://accepted-qa.supabase.co` and key `accepted-local-qa-only` **only as command-process settings**. No environment file, production setting or secret was modified. The browser intercepts auth, API and analytics requests. Questions, scores, summaries and sessions are synthetic; the real application handlers and calculations run against those fixtures.

For a fresh local checkout:

1. Install the existing locked dependencies with `npm ci` (no package changes).
2. Build and start locally using the two synthetic public settings above. These are QA placeholders, never deployment settings.
3. Open a fresh Playwright CLI Chromium session with the executable available in your environment; use a 1440×1000 viewport and reduced motion.
4. Run `playwright-cli -s=review run-code --filename=docs/qa/browser-checks.js` and then `docs/qa/interaction-checks.js` in that same session. Set the screenshot output path at the top of the first script to your checkout's `docs/screenshots` directory.
5. Run `node docs/qa/verify-preservation.cjs d75c5baee88b745544fc674534f1aa76ff2f881e` (or the PR's unchanged base ref).

The data modes in the browser script are test-only fixture switches: demo, empty, one, worst/1,000, loading and error. No fixture toggle, synthetic session, auth bypass or test-only route ships in the application.

## Limits and remaining verification

- Real Supabase sessions, confirmation emails, password-reset delivery, live Groq evaluations and real production analytics were intentionally not exercised. Mocked calls verify the frontend contract; they do not verify those services.
- Speech unavailability, synthetic transcription and denied microphone permission are covered. Real microphone capture, browser recognition-service behavior, restart/watchdog timing, and physical audio were not tested; the existing implementation is unchanged.
- No physical iPhone/Android, Safari/WebKit/Firefox, screen-reader session, or mobile GPU/frame-time recording was available. Desktop Chromium viewport checks do not prove native-device behavior.
- The existing ESLint setup remains unconfigured. No additional lint dependency or backend fix is included.
- Existing storage behavior is retained, including silent EC draft-write failures when browser storage is unavailable. Malformed-data and permission handling beyond the existing frontend contracts was not broadened into backend or schema work.
- No new scholarship-discovery service was invented: the repository contains an Ontario admissions program guide and preparation tools, not a scholarship dataset.

[Screenshot gallery](screenshots/README.md) · [Audit](frontend-redesign.md) · [Design system](../.interface-design/system.md)
