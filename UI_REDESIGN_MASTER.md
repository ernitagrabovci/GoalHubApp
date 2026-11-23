# UI Redesign Master Specification

## 0. Mission and scope
Modernize the **existing, running application's frontend source code** into a cohesive, premium, accessible and responsive product. This is an implementation assignment, not a Figma, mockup, static prototype, or greenfield rebuild assignment. Preserve functionality, business logic, routes, API contracts, authentication, permissions, validation, localization, and data flows. Never deploy without approval.

## 1. Brand foundation: primary `#2E7D5B`
The supplied logo's primary brand color is **`#2E7D5B`**. Treat this as the canonical brand anchor. Do not replace or alter the logo. Derive supporting shades, semantic colors and surfaces rather than coloring every component green. Inspect existing brand assets and any established secondary colors before overriding them.

### Proposed initial light-theme palette (verify contrast in real contexts)
| Token | Hex | Intended use |
|---|---|---|
| `brand-50` | `#F0F8F4` | Subtle green surfaces |
| `brand-100` | `#D9EEE2` | Soft highlighted states |
| `brand-200` | `#B5DCC6` | Borders and accents |
| `brand-300` | `#86C4A2` | Decorative accents |
| `brand-400` | `#58A77E` | Non-text accents |
| `brand-500` | `#398F68` | Secondary brand tone |
| `brand-600` | `#2E7D5B` | **Canonical brand / primary actions** |
| `brand-700` | `#256649` | Primary hover / strong accents |
| `brand-800` | `#1D513B` | Active and dark brand elements |
| `brand-900` | `#143B2B` | Deep brand backgrounds |
| `surface` | `#FFFFFF` | Main cards/panels |
| `canvas` | `#F7F9F8` | Page background |
| `surface-muted` | `#EFF3F1` | Secondary surfaces |
| `border` | `#DCE5DF` | Neutral dividers |
| `text-primary` | `#17251E` | Main content |
| `text-secondary` | `#52645A` | Secondary content |
| `focus-ring` | `#2E7D5B` | Visible keyboard focus (test against adjacent surfaces) |

Use separate, recognizable semantic tokens for success, warning, danger and info; do **not** use brand green as the only indicator of success. Define hover, active, disabled, focus, selected and dark-mode variants where the app supports them. Verify WCAG 2.2 AA contrast with a tool; adjust shades or foreground colors when needed. In particular, do not assume white text on every light brand shade is accessible. Preserve existing theme preference support.

### Implementation
Map these tokens into the **existing** CSS variables, Tailwind configuration, design-token system, or component theme. Avoid scattering hard-coded hex values across files. Keep legacy colors only when they serve a documented semantic or branding purpose. Before changing the palette globally, audit screenshots for current hierarchy and identify potential regressions in charts, badges, tables and forms.

## 2. Discover and use installed skills
Inspect the agent's installed skills and their actual instructions. Prefer `design-taste-frontend` from `leonxlnx/taste-skill`; use `ui-ux-pro-max`, `frontend-design`, and `web-design-guidelines` **only if actually installed**. Do not invent skill capabilities, commands or results. Skills are design/engineering guidance, not substitutes for source inspection and testing.

## 3. Repository discovery — evidence before assumptions
Before editing, inspect Git status, project manifests, dependency versions, routing, layouts, shared components, CSS/Tailwind tokens, assets, frontend state, permissions, validation, translations, tests, build scripts, and app startup instructions. Enumerate actual pages/modules from route definitions and code. Inspect relevant files before claiming anything about them. If a working browser is available, run the application and capture baseline screenshots for representative routes and viewports. Do not fabricate unseen pages or features.

Identify the stack and work **within it**: React remains React; Laravel Blade/Livewire remains Blade/Livewire; preserve component state and event contracts. Do not introduce a new framework or component library without explicit approval. Respect unrelated uncommitted changes.

## 4. Design and UX outcomes
Improve the real UI substantially while retaining its product identity. Prioritize:
- Shared app shell, sidebar, top bar, navigation, content width, grids and responsive breakpoints.
- Typography scale, spacing rhythm, visual hierarchy, density and readable contrast.
- Tables (sorting/filtering/pagination), forms (labels/errors/validation), buttons, menus, tabs, dialogs, notifications, cards, charts and authentication screens.
- Loading, skeleton, empty, error, success, permission-denied and disabled states.
- Keyboard navigation, focus visibility, semantic HTML, labels, touch targets and accessible announcements.
- Mobile/tablet behavior that adapts information architecture instead of merely shrinking desktop UI.

Avoid generic AI dashboards, gratuitous gradients, excessive shadows, random radii and oversized cards. Preserve efficient information density in operational software. Keep text and labels in the application's existing languages.

## 5. Motion and animation system — required
Introduce **purposeful, restrained movement** throughout the real interface, not decorative motion everywhere. Inspect existing animation libraries and CSS first; prefer lightweight CSS transitions or existing libraries. Add a new motion dependency only if justified and approved.

Motion inventory to consider per component:
- Sidebar expand/collapse and mobile drawer entry/exit.
- Dropdown/popover/dialog open-close with opacity and slight translate/scale.
- Button hover/press/focus feedback, without distracting bouncing.
- Tab/accordion disclosure, filter panel expansion and state changes.
- List/card entrance only when useful; avoid reanimating large tables on every render.
- Loading/skeleton progress, save success, validation and toast feedback.
- Page/route transitions only when compatible with framework lifecycle and navigation.

**Initial motion tokens (adjust after testing):** fast 120–160ms; standard 180–240ms; complex 260–360ms; ease-out for entrances, ease-in for exits. Use opacity/transform where possible; avoid expensive layout thrashing. Never delay essential actions, block input, or create animation-induced CLS. Respect `prefers-reduced-motion: reduce` by removing nonessential movement while preserving state clarity. Check keyboard focus after dialog/route transitions. Avoid animations that conflict with Livewire DOM morphing or React component state.

## 6. Non-negotiable functional preservation
Do not change business logic, database queries, server controllers, API contracts, route URLs, authentication, authorization, permissions, data mutation, payment behavior, uploads/downloads, validation, localization or third-party integrations to achieve cosmetic changes. Preserve React hooks/state semantics and Livewire `wire:*` bindings/events/morphing. Never silently remove actions, fields or data. Flag any unavoidable breaking change and request approval before implementation.

## 7. Mandatory persistent task system
Before implementing, create `docs/ui-redesign/` and maintain:
- `AUDIT.md`: observed facts with file paths and evidence; label hypotheses explicitly.
- `DESIGN_SYSTEM.md`: accepted tokens, component patterns, responsive and motion rules.
- `TASKS.md`: complete task inventory, dependencies, statuses and progress.
- `CHANGELOG.md`: files changed, intent, tests run and outcomes.

If the agent has native task tools, use them **and** maintain these repo files as the durable handoff. Avoid parallel contradictory sources of truth: `TASKS.md` is canonical.

Each task must have ID, module/screen, exact file paths (after discovery), scope, priority, complexity/weight, dependencies, acceptance criteria, regression risks, verification plan, and status. Statuses: `TODO`, `IN_PROGRESS`, `IMPLEMENTED`, `VERIFIED`, `BLOCKED`. Never mark `VERIFIED` based only on editing files. Compute completion from **verified weighted tasks** divided by total planned weight; report both counts and weighted progress. If scope changes, update denominator and explain why. Unknown and blocked tasks are not complete.

### Task execution loop
1. Select the highest-priority unblocked task; set `IN_PROGRESS`.
2. Read actual source and relevant tests; capture baseline behavior.
3. Implement the smallest coherent change in the **real code**.
4. Run relevant formatting, linting, type checks, build and tests.
5. Browser-check actual behavior and responsive visual output when available.
6. Compare against acceptance criteria; fix regressions.
7. Record files, commands, outputs and any screenshot paths; mark `VERIFIED` only with evidence, otherwise `IMPLEMENTED` or `BLOCKED`.
8. Update task files before moving on.

Start with design foundations/shared components; then cover each real module and screen, followed by cross-screen QA and refinement. Batch changes small enough to review and revert. Do not create a huge untracked rewrite.

## 8. Strict anti-hallucination / provenance protocol
Every substantive claim is one of: **VERIFIED** (source/test/browser evidence), **INFERRED** (clearly identified), or **UNKNOWN** (investigate). Never invent files, routes, screenshots, users, APIs, test outcomes, skill installations, or completion. Do not claim a page was visually inspected without running and seeing it. If tooling is unavailable, document the limitation and leave visual verification pending. If tests fail, show actual failure and do not claim success. Avoid guessing at hidden business requirements; ask when a decision materially changes behavior.

## 9. Quality gates and regression checks
At minimum, check supported viewport widths representative of mobile (~375px), tablet (~768px), laptop (~1366px) and wide desktop (~1920px), subject to available tools. Verify navigation, menus, forms, validation, table operations, modals, keyboard access, focus, loading/error states, dark mode if present, and reduced motion. Run the project's existing test suite and build checks. Capture before/after screenshots where possible. Verify no horizontal overflow, clipped controls or unexpected visual changes. Do not disable tests or weaken accessibility checks to obtain a green result.

## 10. Git, security and change control
Check Git status before work. Do not overwrite unrelated work, reset branches, delete data, modify secrets, touch production infrastructure, or deploy. Make incremental commits only if repository policy/user instruction permits. Seek approval for framework migrations, new major dependencies, destructive changes, or backend modifications. Document risks and rollback path.

## 11. Reporting and handoff
First report actual stack, page inventory, top problems, proposed design direction, baseline checks, and task plan. Then **execute** implementation tasks without stopping at the plan, except for blockers or approval gates. After each batch, provide task IDs, modified files, tangible improvements, tests run, evidence, failures, and next tasks. At session start, reread task files and Git state; resume from verified repository state rather than conversational memory. End with a truthful summary and remaining `BLOCKED`/`IMPLEMENTED` tasks.

## 12. Definition of done
The redesign is complete only when all agreed tasks are `VERIFIED`, real application pages use a consistent brand-derived palette and motion language, functional regression checks pass, responsive/accessibility checks are supported by evidence, and remaining limitations are documented. Never claim 100% when unverified or blocked tasks remain.

**Operating rule:** DISCOVER → AUDIT → PLAN TASKS → INSPECT → EDIT REAL CODE → TEST → VISUALLY VERIFY → RECORD EVIDENCE → UPDATE TASK → CONTINUE.
