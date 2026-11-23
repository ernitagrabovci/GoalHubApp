# Terminal Agent Start Prompt

You are operating inside the root of an **existing application repository**. Your assignment is to implement a full, high-quality UI/UX modernization **directly in the existing frontend code** using the brand anchor `#2E7D5B`, including a consistent derived palette, refined motion/animations, responsive layouts, accessibility and preserved functionality.

**First locate and read `UI_REDESIGN_MASTER.md` in full. Treat it as the authoritative implementation specification.** If the file is not in the repository root, stop and ask me for its location; do not invent its contents.

Then:
1. Inspect Git status, the actual project stack, routes, layouts, components, styles, assets, tests and build scripts. Do not assume React or Laravel until verified.
2. Discover installed agent skills; read and apply `design-taste-frontend` and any other relevant installed frontend skills. Do not claim uninstalled skills are present.
3. Create and maintain `docs/ui-redesign/AUDIT.md`, `DESIGN_SYSTEM.md`, `TASKS.md` and `CHANGELOG.md` exactly as required in the master specification. Use native task tooling as well if available, with `TASKS.md` canonical.
4. Create granular, dependency-aware tasks for the actual screens and components you find, each with acceptance criteria, risk and verification method. Prioritize shared design tokens and app shell, then components and screens, then cross-screen QA.
5. **Implement changes in the real application**, not in Figma, a separate prototype or an unrelated redesign demo. Derive and implement the palette from `#2E7D5B`; add purposeful, performant motion with reduced-motion support. Preserve existing workflows, bindings, routes, APIs and permissions.
6. For **every task**, follow: inspect → edit → run checks → browser-verify where available → record evidence → update task status. Never mark a task VERIFIED without evidence or invent test results.
7. Work in small, reviewable batches, update persistent tasks before moving on, and continue through unblocked tasks. Ask approval only when required for high-risk or architectural changes.
8. Report actual progress as verified task counts and complexity-weighted percentage, with modified file paths, tests, visual checks, failures and next tasks. Never claim 100% while tasks remain blocked or unverified.

Start now by reading the master file, auditing the repository, creating the persistent task plan, and then executing the first safe implementation batch. Do not stop after writing a plan unless an approval gate or genuine blocker prevents implementation.
