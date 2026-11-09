# Accepted frontend redesign

## Scope and evidence

Work on `frontend-redesign` in the existing checkout. The prior bundled-font fix
is retained. Only `interface-design` and `vercel-react-best-practices` are active.
All seven product routes and `/login`, authentication overlays and shared states
are included. No API, schema, Supabase helper, Groq prompt, quota, data source,
tracking implementation or persistence schema will change. A SHA-256 baseline in
Git's private directory covers backend, data, persistence and configuration files.

## Human and domain

A Grade 12 applicant comes here after class to turn several university choices
into a manageable next step. They need confidence about what to do, not a promise
of admission. Domain vocabulary: program shortlist, application folio, preparation
window, response, evidence, reflection, university portal and next steps.

Color world: warm prospectus paper, white application sheets, graphite notes,
indigo annotations, pale lavender highlighter and restrained green completion
marks. Signature: an **application folio** connecting Plan → Prepare → Reflect,
with numbered program slips, quiet section labels and a visible practice sequence.
Avoid a generic metric-card grid, an oversized AI chat interface and decorative
charts. Use actual application tools, deliberate writing space and useful data.

## Design system and component checkpoints

Every component uses these shared decisions: warm canvas/white paper elevation;
graphite text with distinct primary, secondary and metadata tiers; indigo only
for actions/selection; soft layered shadows, a 4px spacing grid, 10px controls and
14px surfaces. Native controls and native dialog provide keyboard behavior.
Inter is the readable interface face, Fraunces supplies an editorial moment on
the homepage, and JetBrains Mono identifies timers and measured values. All are
locally bundled. Motion is transform/opacity only, normally 160–240ms, with a
reduced-motion alternative. The focal point changes by task, not by template.

| Component              | Intent and focal hierarchy                       | Density / depth / typography                                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| App shell / navigation | Know the next destination; selected tool leads   | 224px desktop rail; compact mobile header and bottom destinations; 14px labels                               |
| Homepage               | Understand the entire journey and start a plan   | Editorial headline, honest product specimen, connected tool narrative; 32–64px sections                      |
| PageHeader / shared UI | Orient, then act                                 | 28–36px headings; 14px copy; 24px panel padding; shared buttons, badges, notices and empty/loading states    |
| Planner                | Build and act on a private shortlist             | Shortlist is primary; grade context and checklist in the supporting column; numbered program slips           |
| Vault                  | Find and compare program requirements            | Search and university selection lead; roomy comparison rows adapt to mobile program slips                    |
| History                | Read evidence without overstating it             | Compact aligned table, native keyboard sort buttons, small-sample notes and responsive columns               |
| Simulator              | Concentrate on the prompt and time remaining     | Setup becomes a slim supporting rail; timer and editor lead; structured coaching results                     |
| Interview              | Speak or type with clear progression             | One question at a time; microphone state visible; transcript and review remain explicit                      |
| EC rater               | Describe impact, then interpret advice           | Labeled activity sheets; result folio and actionable ranked advice; stable draft controls                    |
| Analytics              | Understand progress and choose the next practice | One useful summary band, score-by-program and eight-week trend, readable history and coaching                |
| Auth / dialogs         | Sign in confidently without losing context       | Native modal focus/escape/return; labeled controls; clear signed-out, loading, error and confirmation states |

## Route and integration plan

1. Establish tokens, UI primitives and workspace/marketing shells.
2. Rebuild home and discovery/planning experiences around real existing data.
3. Rebuild simulator, interview and EC presentations while retaining their state
   machines, timers, validation, requests, recovery paths and storage keys.
4. Rebuild analytics and auth states without changing access rules or endpoints.
5. Verify browser interactions with controlled Supabase/API fixtures, including
   failure and quota states; no real Groq calls. Test 1440, 1280, 834, 390 and
   360px widths, keyboard/dialog behavior, contrast and reduced motion.
6. Capture desktop/mobile screenshots, run build, TypeScript and existing lint,
   compare the backend baseline, then commit and open a review PR without merging.

## Performance choices

Keep the homepage, route wrappers and page shell as server components. Scope
account state and responsive navigation to client components. Keep transient
timer state inside the practice component; don't lift it into global context. Retain lazy history loading and
existing memoized calculations. Use CSS motion, native dialogs and the installed
icon set; add no UI, chart or animation dependencies. Keep analytics mounted.

## Live-service scope

The frontend is complete independently of live Supabase/Groq activation. The user
will supply connection settings later; the exact requirements and follow-up
checks are preserved in `BACKEND_CONNECTION_CHECKLIST.md`. Existing API calls,
authorization and backend code remain intact. Controlled browser fixtures make
all screens and interactions reviewable without real account or provider calls.

## Validation results

Final measured results are recorded below and in `docs/FRONTEND_VERIFICATION.md`.
The source-level boundaries are verified with hashes and a diff against `main`.
The server-rendered page shell gives streamed route content an explicit Suspense
boundary. Auth-dependent UI also keeps its initial loading render stable while
each boundary hydrates. This prevents session restoration from racing streamed
markup; it does not change authentication or access rules.

The final production-browser suite passes all 15 tests, with no skipped checks.
The responsive matrix covers eight routes at five widths (40 cases); axe reports
zero violations on the eight routes and authentication dialog. The gallery has
31 desktop/mobile screenshots, including populated and feedback states.
Standalone TypeScript checking passes. Existing lint stops at its initial ESLint
setup prompt; this pre-existing tooling gap is documented without changing the
application's dependencies. All 28 protected hashes match the starting baseline.
The normal production build also passes without synthetic test settings or a
Google Fonts request.
