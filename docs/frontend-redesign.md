# Accepted frontend redesign

## Audit and direction

Source: `idkanonto/Accepted`, main `d75c5baee88b745544fc674534f1aa76ff2f881e`.
Work branch: `frontend/accepted-premium-redesign`. No production deployment.

### Route inventory

| Route | Existing functionality to preserve | Presentation direction |
| --- | --- | --- |
| `/` | Tracked planner/program/practice links, representative sample prompt, informational disclaimers | Editorial introduction, illustrated application journey, tool directory |
| `/vault` | Eight university selectors, program/requirement/deadline search, saved average markers, practice deep links and tracking | University navigator, readable comparison table and mobile program summaries |
| `/planner` | Program shortlist, average slider, academic alignment, EC fit, checklist, local storage; historical averages search, filter, sorting, self-report disclosures | Planning canvas, next-step rail, clear historical data explorer |
| `/simulator` | Program query parameter, formats, prep/response timers, draft ownership/recovery, queue polling, quotas, all feedback and analytics | Focused practice studio with setup rail, stage indicators, readable feedback |
| `/interview` | Program selection, generated questions, voice/transcription lifecycle and typed fallback, word/character limits, review and tracking | Interview studio with question progress and transcript review |
| `/ec-rater` | Up to eight activities, all fields and limits, drafts, program target, ranking, stored EC level and tracking | Labeled activity editor and coaching panel |
| `/analytics` | Authenticated saved attempts, unchanged calculations, program scores, eight-week trend, Nova summary, clearing history | Progress overview, legible charts and practice record |
| `/login` | Existing Supabase sign-in, sign-up, reset and signed-in account state | Dedicated welcome screen and consistent authentication modal |
| Error / missing route / loading | Existing error recovery; framework missing route | Branded accessible recovery and loading states |

The source has no scholarship dataset or scholarship-discovery route. The overhaul presents existing Ontario admissions functionality accurately; it does not invent scholarship functionality.

### Shared architecture and problems

Next.js 15 App Router, React 19, TypeScript, Tailwind 4, Lucide; Supabase auth/data, Groq scoring, Vercel analytics. Shared Nav, Footer, AuthForm/Modal/Provider, RequireAuth, ScoreRing, ProgramTags/RangeBar/EcFit. Tools own their existing client state.

Existing navy/brass theme has inconsistent control styles, small labels/touch targets, dense comparison tables, limited keyboard support on historical sorting and modal focus management, and weak empty/loading presentation. Navigation gives every tool equal visual weight. All original routes must remain directly reachable.

### Design system

- Light first: warm neutral canvas, white panels, cool inset surfaces, ink typography, indigo interaction accent; accessible semantic amber, red and green.
- Native system sans typography; clear display hierarchy and tabular numerals. No new font or image dependency.
- Consistent 4/8px spacing rhythm; 12px controls, 20px panels, subtle one-pixel borders, restrained shadows.
- Persistent desktop sidebar and breadcrumb header; compact mobile header, primary bottom destinations and an accessible full-navigation drawer.
- Shared buttons, inputs, status messages, empty states, loading skeletons, modal focus containment and focus return.
- Motion: short opacity/transform transitions; no perpetual decorative motion; reduced-motion support.
- Tables retain semantic markup; small screens get program summaries or locally scrollable tables rather than page overflow.

### Functional boundaries

Do not change `app/api/**`, `lib/**`, Supabase files, auth provider, datasets, prompts, algorithms, dependencies/lockfiles, deployment configuration, env files or AGENTS.md. In mixed components retain all fetching, effects, handlers, timers, payloads, validation and storage keys. Only presentation and frontend interaction/accessibility are changed.

### Implementation order

Shared tokens/components and shell → homepage → Vault → Planner/history → Simulator → Interview → EC Rater → Analytics → auth/account → error/loading/not-found → responsive and interaction QA.

### Skill availability

Requested design skills were initially absent. After the user required their use, official upstream sources were located and the allowed skills installed outside the repository. `interface-design` is the primary product UI authority; `emil-design-eng`, `apple-design`, `mobile-native`, `animation-performance`, `break-ui`, and `vercel-react-best-practices` support their relevant phases. The installed allowed `playwright-cli` skill is used for QA. Source commits and decisions are recorded in `.interface-design/system.md`. No unlisted third-party skill is used.

## Validation

See `frontend-qa.md` for actual checks, screenshots, parity results, and limitations. Do not infer live service verification from mocked browser checks.
