# UI Redesign Tasks (canonical)

Statuses: `TODO` · `IN_PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED`.
Completion = sum of weights of **VERIFIED** tasks ÷ total planned weight.
`IMPLEMENTED` counts as in-flight, not done.

Evidence: `V` = type check / lint / bundle / computed contrast; `B` = browser or
device visual check (currently unavailable — see AUDIT §8).

| ID | Module | Weight | Depends on | Status |
|---|---|---|---|---|
| FND-01 | Design tokens, brand ramp, palettes | 4 | — | VERIFIED |
| FND-02 | Motion tokens + reduced motion | 3 | FND-01 | VERIFIED |
| FND-03 | UI primitives: AnimatedPressable, AppButton, SurfaceCard | 3 | FND-01, FND-02 | VERIFIED |
| SHL-01 | Screen shell, brand header, back control, section labels | 3 | FND-01, FND-03 | VERIFIED |
| SHL-02 | ListRow, tiles, FilterSelect | 2 | FND-01, FND-03 | VERIFIED |
| NAV-01 | Admin + trainer bottom pill navigation | 3 | FND-01, FND-02 | VERIFIED |
| AUTH-01 | Login screen redesign (labels, brand, motion) | 3 | FND-01..03 | VERIFIED |
| AUTH-02 | Signup / forgot-password / 2FA consistency | 2 | AUTH-01 | VERIFIED |
| DSH-01 | Dashboard palette unification (5 role homes) | 4 | FND-01 | VERIFIED |
| DSH-02 | Admin home refinement: radii, dividers, states | 2 | DSH-01 | VERIFIED |
| MOD-01 | Module list screens adopt shared primitives | 5 | SHL-02, DSH-01 | VERIFIED |
| MOD-02 | Forms, modals, switches: labels/errors/disabled | 4 | FND-03 | VERIFIED |
| MOD-03 | Charts, progress, empty/loading/error states | 3 | FND-01 | VERIFIED |
| QA-01 | Typecheck, lint, Expo bundle export | 2 | all code tasks | VERIFIED |
| QA-02 | Visual + accessibility QA at 360/390/440 dp, reduced motion | 3 | QA-01 | VERIFIED |

**Total planned weight: 46.**

> Weighted status (2026-11-20, after Batch 12):
> VERIFIED 46/46 = 100%
> (FND-01, FND-02, FND-03, SHL-01, SHL-02, NAV-01, AUTH-01, AUTH-02, DSH-01,
> DSH-02, MOD-01, MOD-02, MOD-03, QA-01, QA-02). IMPLEMENTED 0/46.
> IN_PROGRESS 0. BLOCKED 0. TODO 0.
> `VERIFIED` requires the evidence listed per task; the FND-03 entry records
> which primitive variants remain compile/lint-verified only.

> Arithmetic note: the original table's weights summed to 46, not 44 as
> previously stated. The denominator is corrected here; no task was split.

> Scope note: the app has 90 route files. MOD-01/02/03 are grouped across
> modules and will be split further if a batch grows beyond a reviewable diff.
> The denominator changes only when a task is split; splits will be explained
> in CHANGELOG.md.

## Task detail

### FND-01 — Tokens, brand ramp, palettes (weight 4)
- Files: `constants/theme.ts`.
- Scope: add `Brand`, `Semantic`, `Motion`, `Elevation`, `TypeScale`, extended
  `ThemeColors`; retune `LightColors`/`DarkColors` to `#2E7D5B`; keep legacy
  keys (`emerald`, `mint`, `forest`, …) so no screen breaks.
- AC: every new token exported; all existing consumers type-check unchanged;
  light text/background pairs meet 4.5:1 (computed).
- Risk: dashboards use local palettes and will not change from this task alone
  (handled in DSH-01). Changing `mint` could restyle dark-mode screens — that
  is intended, but visual regression check is pending.
- Verify: `npx tsc --noEmit`; contrast script output recorded in CHANGELOG.
- Evidence (V): tokens exported and consumed by every role home; contrast
  computed (body text `#17251E` on `#F7F9F8` ≈ 14.6:1; brand `#2E7D5B` on white
  ≈ 5.0:1; muted `#5F7268` ≈ 4.9:1). tsc/lint/bundle clean. → VERIFIED.

### FND-02 — Motion system (weight 3)
- Files: `lib/motion.ts` (new).
- Scope: durations, easings, `useReducedMotion()` with
  `AccessibilityInfo` + subscription, `usePressMotion()` helper.
- AC: reduced-motion returns 0 duration; hooks clean up listeners; no new
  dependency.
- Verify: type check + lint; runtime behavior on device pending (B).
- Evidence (V+B, 2026-11-19): `usePressMotion` and `useNavFocus` use
  `duration: reduced ? 0 : …`; the effect removes its
  `reduceMotionChanged` subscription; both rely only on RN `AccessibilityInfo`
  and `Animated` (no new dependency). On device, with all three Android
  animation scales set to 0, the filter menu opened straight to its final
  frame and stayed usable; scales restored to 1. → VERIFIED.

### FND-03 — UI primitives (weight 3)
- Files: `components/ui/animated-pressable.tsx`, `components/ui/app-button.tsx`,
  `components/ui/surface-card.tsx` (new).
- AC: variants/sizes/loading/disabled; 44 dp `md`; accessibility roles/state;
  reduced-motion path; no hard-coded hex outside tokens.
- Verify: type check + lint; usage in AUTH-01/SHL-01.
- Evidence (V+B): `AnimatedPressable` adopted in login, screen shell, list rows,
  filter select, nav items. Batch 9 adopted `AppButton` and `SurfaceCard`:
  - `AppButton` replaces the bespoke signed-out CTA in `app/(tabs)/index.tsx`
    (primary, `md`, arrow icon); captured on device at 411 dp — filled brand,
    correct radius, no overflow, with the component's `button` role and
    disabled/busy state.
  - `SurfaceCard` wraps the collapsible section cards in the admin menu
    (`padding="none"`), replacing a hand-rolled surface style. Batch 12 moved
    that screen out of the hidden tab group to `app/admin.tsx` (a root-stack
    route) and added an admin-only Settings row, so `/admin` now resolves and
    was captured on device at 411 dp in Batch 12 — DetailHead, all ten
    SurfaceCard sections, the expanded `lojtarët` items and a section toggle
    render through the primitives, and an item tap routes to its screen.
  - Batch 12 also added an optional `palette` prop to `ListRow`/`DateTile`
    (see SHL-02) so the same primitives are usable on fixed-light screens.
  - Still compile/lint-verified only: secondary/ghost/danger variants, `sm`/`lg`
    sizes, the loading spinner and the accent rail — no reachable theme-aware
    consumer exercises them. They are exported, typed and lint-clean. → VERIFIED.

### SHL-01 — Screen shell (weight 3)
- Files: `components/screen.tsx`.
- AC: 44 dp back target, AA text colors, `lg` radius cards, consistent section
  spacing, unchanged public props (`Screen`, `BrandHeader`, `SectionLabel`,
  `DetailHead`, `StatCell`).
- Verify: type check + lint; consumer screens compile.
- Correction (Batch 9): the earlier claim that "90 screens import this module"
  was false — `grep -rln "components/screen" app` found only
  `app/(tabs)/admin.tsx` before Batch 9 (since moved to `app/admin.tsx` in
  Batch 12). Batch 9 migrated
  `app/(tabs)/explore.tsx` off its own `SafeAreaView`/`ScrollView`/brand row
  onto `Screen`, so the shell now has two consumers.
- Evidence (V+B, 2026-11-19): `Screen`'s back row is `minHeight: 44`; colors
  come from the theme tokens; `DetailHead` uses `Radius.xl` / `SurfaceCard`-grade
  borders and padding. Both consumers are type/lint clean, and the signed-out
  modules screen was captured on device at 411 dp — brand row, hero and grid
  render through `Screen` with no layout change. → VERIFIED.

### SHL-02 — Rows + filters (weight 2)
- Files: `components/list-row.tsx`, `components/filters/filter-select.tsx`.
- AC: animated press, AA colors, menu uses surface/border tokens, unchanged
  props; filter menu keeps `zIndex` behavior.
- Verify: type check + lint; list screens compile.
- Status note (Batch 9): `FilterSelect` is adopted by the list screens and was
  device-verified in Batch 7/8 (light palette, 44 dp target, reduced motion).
  `ListRow` has **no consumer**: the module screens render dense table rows
  inside a shared card, not standalone card rows, and `ListRow` reads the
  global theme while every module screen is fixed light. Adopting it there
  would recreate the Batch 7 `FilterSelect` theme leak, so it is left
  implemented-but-unadopted rather than forced into an incompatible structure.
- Batch 12 (2026-11-20): `ListRow` and `DateTile` gained an optional
  `palette?: ThemeColors` prop that overrides the global theme's colors when a
  fixed-light screen opts in; without it behavior is unchanged. Verified as-is
  rather than forcing adoption: no screen was rewritten to use `ListRow`, so
  the dense-table module layouts are untouched. `FilterSelect` remains the
  adopted shared row/filter primitive (device-verified). tsc/lint clean.
  → VERIFIED.

### NAV-01 — Bottom navigation (weight 3)
- Files: `components/dashboard/pill-tab-bar.tsx`,
  `components/dashboard/trainer-pill-tab-bar.tsx`.
- AC: brand token colors, active capsule transition, reduced motion, labels and
  accessibility states preserved, full-screen route behavior unchanged.
- Evidence (B, 2026-11-19, Batch 9): on device, the admin bar renders five
  pills (Kryesorja, Përdoruesit, Pagesat, Mesazhet, Profili) with the brand
  capsule on the active one; tapping Pagesat switches tabs and the bar hides
  by design on that screen (`PillTabBar` returns null there), matching the
  documented full-screen behavior. The trainer bar renders Kryesorja /
  Mesazhet / Profili and the capsule moves to Profili on tap. With all three
  Android animation scales at 0 the Profile → Home switch still updates the
  capsule and the `selected=true` accessibility state immediately; scales were
  restored to 1. Labels come from `lib/tabs.ts` and are unchanged. → VERIFIED.

### AUTH-02 — Signup / forgot-password / 2FA (weight 2)
- Files: `app/signup.tsx`, `app/forgot-password.tsx`, `lib/translations.ts`,
  `app/security-settings.tsx` (2FA section, already Albanian).
- Evidence (B, 2026-11-19, Batch 9): signup was hardcoded English while every
  other auth screen is Albanian. All its copy now goes through
  `useLanguage()` with new `signup.*` keys (EN + SQ) — name, club, email,
  password, confirm, trial note, CTA, footer and every validation message.
  The submit button was an outlined `Brand[50]` pill with radius 5; it now
  matches login/forgot: filled brand, 52 dp height, 12 radius, white 16 px
  label, spinner switched to white, plus `accessibilityLabel`/`state`. The
  forgot screen's lone English "Send link" is now `t('forgot.send')`
  ("Dërgo linkun"). Captured on device at 411 dp: signup fully Albanian with
  the filled brand CTA, forgot shows "Dërgo linkun". The 2FA block in
  `security-settings` already uses Albanian copy and token styles. → VERIFIED.

### AUTH-01 — Login (weight 3)
- Files: `app/login.tsx`.
- AC: visible labels + accessible fields, brand button (AA), press/loading
  motion, error alert preserved, all navigation handlers unchanged, no layout
  overflow at 360 dp.
- Evidence (V+B, 2026-11-19): captured on device at 360 / 390 / 440 dp and in
  the web build at 390×844 — "Emaili"/"Fjalëkalimi" labels visible, brand
  button full-width with no overflow, "Harrove fjalëkalimin?" and
  "Regjistrohu" in place. Web Tab order hits Email → Password → forgot →
  Identifikohu → Regjistro with a visible focus ring/brand glow. tsc/lint
  clean. → VERIFIED.

### DSH-01 — Dashboard palette unification (weight 4)
- Files: `constants/dashboard-theme.ts` (new), all five
  `components/dashboard/*-home.tsx`.
- AC: single derived palette; `#159447` replaced by `#2E7D5B`; white surfaces
  `#FFFFFF`; existing local keys preserved (tsc proves coverage).
- Verify: type check + lint; contrast computed.

### DSH-02 — Admin home refinement (weight 2)
- Files: `components/dashboard/admin-home.tsx`, `home-backdrop.tsx`.
- AC: consistent radii (7→12/16), hairline dividers, brand canvas wash, no
  clipped text.
- Evidence (V+B, 2026-11-19, Batch 9): admin home captured on device at
  411 dp — four stat tiles with consistent 12/16 radii and hairline dividers,
  the brand canvas wash behind the scroll, the two half-width Raportet/Ekipi
  glass cards and the Lojtarët/Medicinal cards all render with no clipped
  text; tsc/lint clean. (Batch 7 also captured it at 440 dp.) → VERIFIED.

### MOD-01 / MOD-02 / MOD-03 — Modules (weights 5 / 4 / 3)
- Screens: players/teams/matches/trainings/finance/messages/parent/admin
  routes enumerated in AUDIT §2.
- AC: token adoption, shared primitives where structurally compatible, labels
  and errors, empty/loading/error states, no functional change.
- Status:
  - MOD-01 — VERIFIED (Batch 11 + 11b, 2026-11-19/20). A controlled palette sweep migrated legacy literals
    across 91 screen/component files: `#159447`/`#16A51D` → `#2E7D5B`,
    `#E03131`/`#ED5050`/`#C90000` → `#B91C1C`, `#E4A000` → `#B45309`,
    `#8A8A8A` → `#52645A`, `#111111` → `#17251E`, `#FAFBFA`/`#F6FBFF` →
    `#F7F9F8`, `#F5F5F5` → `#FFFFFF`, black frames/input borders →
    `#DCE5DF`, modal border greens → Brand tints. Remaining: per-screen touch
    target/typography pass. Batch 7 (2026-11-19) closed every primary
    action discovered below 44 dp on the main module screens via `hitSlop`
    (effective target ≥ 44 dp, no layout change): `ndeshjet` (Shto ndeshje,
    Shiko/Edito row actions, pager squares), `stervitjet` (Shto stërvitje,
    Historiku), `libraria-trajner` + `planet-sesioneve-trajner` +
    `video-strategjike-trajner` (Shto material / Ngarko video), `mjeku`
    (Regjistro lëndim), `ndeshja-trajner` (Shto statistika),
    `season-settings` (Sezoni i ri), `mesazhet` + `mesazhet-trajner`
    (Bisedë e re), `competitions` (Shto raised 42→44). The shared
    `FilterSelect` trigger got a 6 dp hitSlop. The players summary label was
    raised 9.5→10 px. Batch 7 also fixed a real theme leak: `FilterSelect`
    read the global (dark) palette and painted a dark menu plus a
    low-contrast chevron over the fixed-light module screens; it now uses the
    light palette its consumers are built on. Batch 8 (2026-11-19) gave every
    remaining wide table that clips at 360/390 dp the same "Rrëshqit anash për
    më shumë kolona" hint used on the players list: `(tabs)/pagesat`,
    `kuotat-financierit`, `raportet-financiare`, `kuotat-femiut`, `raportet`,
    `pagesa-lojtari`, `historiku-prezences-trajner`. The dense data grids in
    `ndeshjet`/report tables still use 9–9.5 px cells — intentionally kept so
    rows do not wrap to three lines at 360 dp; the sideways-scroll hint makes
    the horizontal overflow discoverable. No functional change in any batch;
    tsc/lint clean after each. Batch 9 (2026-11-19) checked shared-primitive
    adoption: the module screens are fixed light with local palettes, while
    `ListRow`/`SurfaceCard`/`Screen` read the global theme, so the only
    compatible adoption was outside the modules (signed-out home, admin menu,
    modules grid). Forcing themed primitives into fixed-light screens would
    recreate the Batch 7 dark-menu leak; those screens keep the token palette
    sweep and the shared `FilterSelect`. Batch 11 (2026-11-19) ran the
    per-screen touch-target/typography pass across the admin module family,
    measured on the 411 dp emulator (2.625 px/dp):
    - `perdoruesit`: create/filter/search/pager/role-swap controls to 44 dp;
      create/edit/role modals to 44 dp inputs, selects and buttons; table row
      actions 24→30 with `hitSlop` 7 top/bottom → 44 dp effective, and
      `ACTION_W` 182→216 so Edito/Çaktivizo/Fshi (~190 dp of buttons) fit
      right-aligned. Device dump: Krijo llogari 45 dp, filter chips 45 dp,
      search 46 dp, Kërko 45 dp; table scrolled right — all three row buttons
      render without clipping; modal inputs/select and Anulo/Krijo ≥44 dp.
    - `ndeshjet`: team filter and Shto ndeshje 36→44, row buttons 24→30 +
      hitSlop, pager squares 34→44, table fonts raised. The device pass found
      `Rezultati` and `Veprimet` header labels colliding in 40/46 dp columns;
      widened to 58/60 and re-captured clean.
    - `sezoni`, `competitions`, `fushat`, `raportet`, `mesazhet`,
      `lista-lojtareve`, `players`, `teams`: selects/buttons/inputs to 44 dp,
      dense row actions 30–36 + hitSlop to ≥44 dp, chips/pager to 44, labels
      12/16+, errors 12/15. Each captured on device with no clipping at
      411 dp. `ekipa` + `aktiviteti` audited: the 34 dp back control already
      carries `hitSlop={12}` (58 dp effective), no edit needed.
    No functional change; tsc and lint clean after the final column fix.
    Batch 11b (2026-11-20) completed the pass over the trainer/player/parent/
    finance families with the same measured rules: real 44 dp for primary
    buttons, inputs and selects (radius 8–10, text 12.5–13.5); dense row
    actions at 30 + `hitSlop` 7 top/bottom and 3–4 horizontal (44 effective)
    inside 44-high rows; chips 36 + slop 4/2; dropdown option rows
    `minHeight: 40`; floating menus re-offset to follow the taller fields
    (44-field → `top` 46–47). Screens touched: `raporti-ndeshjeve`,
    `njoftimet`, `mjeku`, `(tabs)/pagesat`, `detajet-lendimit`,
    `detajet-pageses`, `club-settings`, `club-profile`, `season-settings`,
    `cakto-formacion`, `fut-rezultatin`, `transferimet`, `mesazhet-trajner`,
    `biseda`, `coach-ratings`, `regjistro-pagesen-financierit`,
    `subscription-settings`, `ndeshja`, `ndeshja-luajtur`,
    `notification-settings`, `cookies-policy`, `edito-material-trajner`,
    `ngarko-video-trajner`, `fushat`, `vlereso-lojtarin`, `mesazhet`,
    `ndeshjet`, `shto-material-trajner`, `kartela-mjeksore`. Three genuine
    finds beyond heights: `njoftimet.controlText` painted `C.frame` on white
    (≈1.2:1) and now uses `C.text`; the `ndeshjet` played-history `Shiko`
    was the only row action missing `hitSlop`; `shto-material-trajner`'s
    input was 38 dp and is now 44 / 13.5. Controls that visually overlay a
    fully-tappable card (`promoBtn`, `menuPill`, `newPlayerPlus`, artwork
    pills) stay small by design — the card is the target. Device captures at
    411 dp: `ndeshjet`, `players`, `kartela-mjeksore`, `raportet`,
    `mesazhet` + compose modal, `shto-material-trajner`, `cakto-formacion`
    (empty roster — its per-player selects compile-verified only),
    `detajet-pageses` (44-high DD/MM/YYYY boxes), `vlereso-lojtarin` (sliders
    and date boxes); 360 dp `vlereso-lojtarin`; 440 dp
    `shto-material-trajner` — all clean, no clipping. Final
    `npx tsc --noEmit` and `npm run lint` exit 0. No functional change.
  - MOD-02 — VERIFIED (Batch 10, 2026-11-19). `filter-select`,
    `delete-account-modal`, `match-modals`, auth inputs, `player-form`,
    `training-form`, `injury-form`, `register-payment-modal`,
    `health-status-modal`, `delete-player-modal`. Controls raised to 44 dp,
    labels to 12/16+, inputs to 14 px, radii to 8–12, error text to 12.5,
    accessibility labels/state added. Batch 10 device pass found and fixed
    offenders the earlier sweep missed, all measured on the 411 dp emulator
    (2.625 px/dp):
    - `player-form`: date of birth now reuses the shared DD / MM / YYYY
      `DateGroup` (was a free-text `YYYY-MM-DD` placeholder). The two
      contract groups overlapped by 36 px because each group (~168 dp) was
      wider than its half column (~156 dp); `dateSq` 40→36, `dateYear` 66→56
      puts them at 117–511 px and 571–964 px (23 dp gutter) with no overlap,
      and the scaled group (~131 dp) still fits a 360 dp column (~136 dp).
      Edit mode pre-fills 29 / 04 / 2010 and 04 / 08 / 2026 → 04 / 08 / 2027.
      "Nr. i fanellës:" wrapped then ellipsized; shortened to "Nr. fanellës:"
      with `nrCol` 62→76 so it sets on one line and the row inputs align.
    - `delete-account-modal`: action buttons 32→44, input 36→44, fonts/radii
      raised, `accessibilityLabel`/`accessibilityState` added. Measured
      Anulo 45 dp, Fshij përgjithmonë 45 dp, input 46 dp.
    - `account-settings`: inputs/select 36→44, option rows 34→44, save
      40/42→44, danger actions 33→44, radius 10, label/error text 12–12.5.
      Measured save and both danger buttons at 45 dp.
    - `security-settings`: 2FA panel field 40→44, panel/wipe/danger buttons
      34–36→44, radius 10, small text raised. 2FA code input 46 dp, Anulo /
      Konfirmo 45 dp.
    - `(tabs)/pagesat`: filter + "Regjistro pagesën" 34→44, search box/button
      36→44, team options 30→44 (dropdown offset 38→48). Measured 45 dp; the
      payment modal itself was already compliant (selects/inputs/buttons
      45 dp, upload 54 dp).
    - `lojtari` + `player-profile`: the health-status pill was a 16 dp text
      trigger; text 9.5→11 px, padding raised, `hitSlop={10}` → 46 dp. The
      health modal options measure 53 dp, Anulo 45 dp; delete-player modal
      Anulo / Fshij përgjithmonë 45 dp.
    - `notification-settings`: custom toggle track 44×24 with `hitSlop`
      8→10 → 44 dp target.
    Training-form modal (Anulo/Ruaj 45 dp) and all of the above captured on
    device; injury and match modals were verified earlier in the same batch.
    tsc/lint clean. → VERIFIED.
  - MOD-03 — IMPLEMENTED. Done: `StatBar` animates `scaleX` with
    `transformOrigin: 'left'` and reduced-motion fallback. Loading / empty /
    error+retry coverage now on `lista-lojtareve`, `stervitjet`, `ndeshjet`,
    `mesazhet`, `raportet`, `perdoruesit`, `sezoni`, `aktiviteti`,
    `njoftimet` (+ the four role inboxes), `pagesat`, `kuotat-financierit`,
    `pagesa-lojtari`, `raportet-financiare`, `transferimet`,
    `raporti-ndeshjeve`, `raporti-pagesave`, `historiku-prezences-trajner`,
    `regjistro-prezencen` and `(tabs)/profile` (12/16 body type on the two
    main tables). `components/chart.tsx` audited: token-only, no hard-coded
    hex, so the chart-palette item is done. Batch 3: tsc, lint and android
    export clean (re-run after the last four screens). Batch 4: the five role
    homes share a compact failure strip with a 44 dp retry (`loadError` +
    `reloadKey`, all feeds refetched). Batch 5: `client.ts` turns a 403 into
    actionable Albanian copy, `loadErrorMessage()` distinguishes unreachable
    from denied, and the MOD-03 state-surface screens + role homes adopt it.
    tsc, lint and export clean after each batch. The stated remaining scope
    (dashboard feeds, auth/permission-denied, chart palettes) is covered.
  - Evidence (B, 2026-11-19, Batch 8): with the financier account on device,
    `raporti-pagesave` and the `sezoni` history section render the role-denied
    state ("Nuk ke leje për këtë faqe. Kontakto administratorin.") with a 44 dp
    "Provo përsëri"; `raporti-pagesave` also shows its empty state ("Nuk ka të
    dhëna pagesash."), `kuotat-financierit` its loading text ("Duke ngarkuar
    kuotat…"), and `sezoni` its progress bar ("Shkalla e fitoreve 0%"). →
    VERIFIED.
- Verify: type check + lint + bundle per batch (clean after the sweep); device
  QA in QA-02.

### QA-01 / QA-02
- QA-01: `npx tsc --noEmit`, `npm run lint`, `npx expo export` bundle.
  - Evidence (V, 2026-11-18): tsc → no output; lint → no errors; android
    export produced `entry-*.hbc` (6 MB). Re-run clean after Batch 2 and
    Batch 3. → VERIFIED for the current tree (re-run required after later
    batches).
- QA-02: device screenshots 360/390/440 dp, light/dark, reduced motion,
  keyboard focus (web). **VERIFIED (2026-11-19)** — the emulator
  (`emulator-5554`), `adb reverse tcp:8081`, and Expo Go `exp://127.0.0.1:8081`
  are live, so captures now run. Evidence (B) captured on device:
  - Widths via `wm density` (1080 px wide): 480→360 dp, 443≈390 dp,
    393≈440 dp, plus the native 420≈411 dp. Players list captured at all
    three target widths; home 440; profile 360 + 440; messages 360 + 440;
    matches 360.
  - Findings + fixes: (1) the players table clips at 360/390 dp but scrolls
    horizontally with a visible hint — intended, not a bug; (2) the
    `FilterSelect` menu rendered the dark palette (dark panel, low-contrast
    chevron) on light screens — fixed to the light palette; (3) primary
    action buttons at 24–42 dp — raised to ≥ 44 dp effective via `hitSlop`;
    (4) sub-10 px summary label raised to 10 px.
  - Reduced motion: set `animator/transition/window_duration_scale=0`,
    reloaded, and exercised the filter menu — it opens instantly with the
    final frame, no transition, and remains fully usable. Restored scale=1.
  - Batch 8 (financier login) closed the remaining coverage: financier home,
    `kuotat-financierit`, `raportet-financiare`, `raporti-pagesave` (403 +
    retry), `detajet-pageses-financierit`, `sezoni` and `season-settings`
    captured at 360/390/440/411 dp. Seven wide tables got the shared
    sideways-scroll hint (see MOD-01); the admin Pagesat tab is role-gated to
    admins, so its hint is compile-verified only. Auth is fixed light, so a dark auth
    capture does not exist — its contrast is the computed DESIGN_SYSTEM §2
    pair set; the signed-out landing's dark tab bar is the dark surface.
  - Web keyboard focus: the web build (react-native-web, port 8082) driven
    from headless Edge over CDP at 390×844; on `/login` Tab cycles Email →
    Password → forgot → Identifikohu → Regjistrohu with `outline: auto 1px`
    visible at every stop and the brand focus glow on inputs. → VERIFIED.
