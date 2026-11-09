# Frontend polish — November 9, 2026

This follow-up applies the explicitly authorized Emil Kowalski
`emil-design-eng` and Corey Haines `copywriting` skills. No SEO skills or metadata
changes are included. The first polish pass retained the original application-folio
design, typography, colors, route structure and hero headline. The subsequent
color pass below replaces the palette at the user’s request.

Copy diagnosis: **B, real voice present.** The existing draft speaks directly to
Ontario applicants and connects Plan → Prepare → Reflect. Keep that argument;
replace vague supporting lines with the actual actions each tool offers.

Primary homepage action: build a program shortlist. Audience: Grade 12 Ontario
university applicants comparing choices and preparing supplemental applications.
Use the product and redesign brief as context; no traffic-source or conversion
results are assumed. Keep the tone warm, specific and calm.

| Before | After | Why |
| --- | --- | --- |
| Journey links fall into the 40px icon column on mobile | Links sit under the section text and wrap across the available width | Readable labels and at least 44px tall tap targets |
| Mobile hero buttons split a narrow row | Full-width stacked actions | A clear primary action without broken button labels |
| “Build my application plan” | “Build my shortlist” | Names the first action and fits the control |
| “Practise showing up as yourself” | “Practise supplemental answers with feedback from Nova” | Describes the supported activity |
| Decorative sign-in introduction | Explains scored responses, feedback and practice history | Sets expectations before account access |
| Hover effects on touch devices | Hover styles limited to fine pointers with hover support | Prevents sticky tap highlighting |
| Route, feedback and dialog entry movement | Immediate content, with subtle pointer press feedback | Keyboard actions and repeated tasks feel immediate |
| 13px mobile form inputs | 16px inputs below 768px | Readable entry and prevents iOS focus zoom |
| Danger buttons lack shared disabled styling | Danger and icon controls share disabled feedback | Consistent interaction states |

The score ring settles in 240ms rather than 600ms. Reduced motion disables press
scaling. Tooltip keyboard focus reveals content immediately. Existing keyboard,
dialog and tab behavior remains intact.

## Copy choices

The existing hero headline is locked: “Your future is taking shape. Let’s give it
a plan.” Supporting copy supplies the concrete product explanation.

Alternatives considered for the primary CTA:

- **Build my shortlist** (selected): the precise first step in Planner.
- **Start my application plan**: accurate, but longer and less specific.
- **Choose my programs**: risks implying a recommendation is made for the visitor.

Practice headline alternatives:

- **Practise the answer before you submit it.** (selected): connects practice to
  the applicant’s task without promising an admission result.
- **Try a timed supplemental response.**: explicit, but better suited to a control.
- **Prepare your next written answer.**: narrower than the section’s interview links.

Existing statistical values, self-report caveats, official-source guidance and
example labels are preserved. No new proof, testimonial, admission claim or
conversion claim is introduced. Nova’s description reflects the existing written
feedback fields; it does not assert live backend activation.

## Review artifacts

- [Homepage, mobile](screenshots/polish-home-mobile.png)
- [Homepage, desktop](screenshots/polish-home-desktop.png)

## Validation

- Normal production build: passed without synthetic public settings.
- Standalone TypeScript check: passed.
- Normal-build browser smoke: all eight routes at 1440, 1280, 834, 390 and 360px
  (40 cases), zero horizontal overflow and zero uncaught page errors.
- Existing regression suite: 14 checks passed on the full run. The sole failure
  expected the replaced Vault empty-state heading; its locator was updated and
  that check passed on a targeted rerun. All 15 checks are covered and passing.
- axe-core 4.10.3 WCAG checks: zero violations on all eight routes and the auth
  dialog. The test-only dependency was installed under `/tmp`, not the app.
- All three local font preload assets return HTTP 200.
- Homepage CTA navigation, journey-link target sizes, mobile input sizes,
  keyboard press stability and reduced-motion press behavior: passed.

The existing regression suite is run in an isolated temporary copy with its
previously documented browser fixtures. Synthetic public settings are confined
to that local test build; nothing is uploaded or deployed from it. Auth and API
responses are intercepted, with no live Supabase or Groq calls.

Application dependencies, lockfile, backend, authentication logic, database,
quotas, API handlers, data, service configuration, metadata and telemetry
implementation are unchanged. At the end of the first local polish pass, the
Vercel Preview served commit `d3a0b71d84559ad062e2acdb8aa36c4ee2115018`.

## Color pass — forest, paper and copper

The user requested a more distinctive app palette after the copy and interaction
pass. This is a color-only frontend follow-up: the earlier copy and interaction
changes are retained.

| Before | After | Purpose |
| --- | --- | --- |
| Cool off-white and white surfaces | Warm paper `#f3eee4`, ivory sheets `#fffcf5` | A prospectus and application-folio feel |
| Indigo actions and lavender washes | Forest `#235947` actions and sage `#e2eadf` feedback | A consistent, recognizable action color |
| Pale workspace rail | Deep forest `#1c3c32` with warm gold `#e3bf87` selection | A distinct visual frame for the tools |
| Indigo editorial accents | Copper `#8b482f` on hero type, folio numbers and journey icons | Editorial emphasis separate from interaction states |
| Lavender product specimen | Parchment cover `#e8d9ba`, forest toolbar, ivory content | Connects the homepage specimen to the workspace |
| Cool-gray field outlines | Warm-gray `#918878` control outlines | Visible controls on the paper surfaces |

All shared control, table, tab, dialog, notice, timer, range, coaching, mobile
navigation and focus colors follow the new palette. The favicon matches the
forest action color. Sidebar-scoped tokens keep its labels and buttons readable;
they do not change the light mobile navigation dialog. Gold selected items retain
their existing `aria-current` semantics. Success, warning and error use labeled
moss, ochre and brick states rather than relying on color alone.

Validation for the color pass:

- Normal production build and standalone TypeScript: passed.
- Existing production-browser suite: **15 passed, 0 failed, 0 skipped**.
- Signed-in responsive matrix: **40 cases passed** across eight routes and five
  widths. Timed sessions and feedback layouts also passed their existing checks.
- axe-core 4.10.3: **zero violations** on all eight routes and the auth dialog.
- Normal-build signed-out smoke: **40 cases passed**, zero uncaught page errors,
  three local font assets returning HTTP 200, and keyboard/reduced-motion checks
  passed. Public-page screenshots use no service fixtures.
- Palette contrast calculations: **29 pairs passed**, with 4.5:1 required for
  normal text and 3:1 for tested control/graph boundaries. The lowest tested
  normal-text ratio is 4.54:1.
- The test fixture build stays in `/tmp/accepted-color-fixture`. Browser service
  fixtures remain local and are never deployed.
- Start-of-turn hashes verify all other 117 tracked files are unchanged. The only
  tracked changes in this color pass are CSS, favicon and design-system notes.
  Earlier uncommitted work is preserved.

Review the new [homepage](screenshots/color-home-desktop.png),
[mobile homepage](screenshots/color-home-mobile.png),
[Planner](screenshots/color-planner-desktop.png) and
[mobile Planner](screenshots/color-planner-mobile.png).

Machine-readable color-pass results: [validation report](screenshots/color-validation.json).

The user subsequently authorized publishing these changes to a Vercel Preview
from `frontend-redesign`. Production remains on `main`; fixture builds are never
deployed. Use the deployment associated with the branch commit for the current
preview.
