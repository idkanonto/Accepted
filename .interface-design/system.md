# Accepted — Application folio

## Intent and domain

Human: an Ontario Grade 12 applicant at a laptop after class, or checking a shortlist on a phone. They need to turn a confusing set of requirements into one achievable next action. The product should feel calm, credible and encouraging, like a beautifully organized application folio.

Domain: university choices; admission ranges; supplemental responses; preparation windows; activity evidence; application deadlines; reflective practice; a student's own voice.

Color world: warm application paper (#f7f8fa); white writing sheets (#ffffff); deep fountain-pen ink (#202633); indigo annotations (#4257cf); pencil graphite (#5d687b); muted amber deadline flags (#946211); green completion marks (#23775a).

Signature: the application folio — a quiet margin for orientation beside a focused working sheet. Numbered stages and narrow reference bands turn requirements into a sequence. It appears in the grouped navigation, home journey preview, university index, planner checklist, practice stages, activity numbering and progress review.

Defaults deliberately replaced: decorative KPI dashboard → real task-first working sheets; identical card grid → university index/table, planner rail, writing canvas, interview studio, activity editor; saturated gradient branding → paper/ink and scarce annotation color. No unsupported scholarship or outcome claims.

## System decisions

Depth: subtle layered shadows only. Hairlines separate information; a soft ring plus two low-opacity depths lift sheets and dialogs. No decorative glow or gradients.

Surfaces: folio canvas #f7f8fa; sheet #fff; control/inset #f1f3f7; selected annotation #eef1ff. Sidebar shares canvas. Dialog is the highest sheet. Scrim uses ink at 36% opacity. Blur only on small sticky navigation, never across the content.

Typography: native system sans chosen for platform familiarity and Apple-like optical weight, with deliberate size/weight/tracking. Body 14–16px, supporting 12–13px, tool title 32–40px/600/-0.04em, sheet title 20px/600/-0.025em, home display 64–80px/600/-0.06em. Body line height 1.6. Numbers use tabular figures; mono reserved for timers/ranges. No network font request.

Spacing: 4px base. Controls 44px minimum, 12px radius. Panel padding 24px desktop/20px mobile, 20px radius. Sections 32–48px apart. Dense table rows have 16px vertical padding. Desktop margin navigation 232px; setup rails 280–300px; content takes priority.

Motion: only short opacity/transform transitions. Press scale .98 at 120ms. Occasional dialog entry 180ms, ease cubic-bezier(.23,1,.32,1). Navigation and typing are immediate. No decorative loops. Reduced motion removes movement; reduced transparency uses solid navigation.

## Component intent checkpoints

Every row inherits palette, depth, surface, typography and spacing values above; only context-specific choices differ.

| Component | Intent | Focal hierarchy | Specific treatment |
| --- | --- | --- | --- |
| Shell/Nav/Footer | Find and move between application tasks | Active tool is the single indigo selection | Same-canvas margin; grouped tool labels; 44px links; mobile destinations + native dialog menu |
| UI controls / dialogs | Act confidently with keyboard or touch | Primary commit action leads; secondary actions recede | Native HTML first; 44px controls; inset inputs; visible focus; top-layer dialog with scroll containment and focus return |
| Home | Understand the admissions tools and take a first step | Large editorial headline + planner CTA | Application folio preview, factual prompt and program context; asymmetric directory rather than repeated cards |
| Vault / signals | Compare requirements and find a program | University selection then program names | Numbered university index; aligned table; mobile summaries; indigo grade band with ink user marker |
| Planner / history | Shortlist and take the next application step | Shortlist is widest; checklist secondary | Folio rail; saved-device state; keyboard sortable historical table; disclosures beside data |
| Simulator | Prepare, write, understand feedback | Prompt/answer dominates setup | 280px setup margin; numbered stages; tabular timer; editorial feedback sheet |
| Interview | Answer in the student's own voice | Current question then transcript | Progress line; optional voice control; retained service disclosures; dimension reviews |
| EC Rater | Describe real impact clearly | Labeled activity fields, then ranking | Numbered activity sheets; persistent labels; draft context; evidence-first coaching |
| Analytics | Understand progress and choose what to practise | Average score leads; program and weekly charts support | Shared data strip; clear bars; textual chart equivalents; readable attempt record |
| Authentication / gate | Sign in without losing context | Account form | Native dialog; selected mode controls; autocomplete; feedback alerts; contextual gate copy |
| Loading / error / empty / missing route | Understand what happened and recover | Plain status + relevant action | Stable skeleton geometry; accessible status/alert; no decorative illustration dependency |

## Skills and provenance

Primary: Dammyjay93/interface-design, commit 2f9be3206855bcb2d1d0af262c8bae25cba6658d.
Specialists: emilkowalski/skills, commit c8a79627b59d72d764d6ab6f2c87c09a48169833: emil-design-eng, apple-design, mobile-native; animation-performance and break-ui loaded in polish/QA.
React: vercel-labs/agent-skills, commit 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62, react-best-practices (metadata name vercel-react-best-practices).
Browser QA: installed playwright-cli skill and CLI in /tmp, outside application dependencies.
User authorizes independent design choices and no additional approval steps. Home composition follows the supplied brief and Apple specialist principles (interface-design is the product UI authority).
