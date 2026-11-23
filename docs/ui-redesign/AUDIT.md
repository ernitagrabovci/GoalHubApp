# UI Redesign Audit

Date: 2026-11-18
Repository: `C:\Users\PC\GoalHubApp`
Branch: `main` (uncommitted work present — see §7)

Every statement below is tagged **VERIFIED** (read from source or command
output) or **INFERRED** (reasoned, not yet proven).

## 1. Stack — VERIFIED

| Layer | Actual |
|---|---|
| Runtime | Expo SDK 58 (`expo ^58.0.0`), React Native `0.88.0`, React `19.3.0` |
| Routing | `expo-router ~58.0.27` (file-based, root `Stack` + `(tabs)` group) |
| Language | TypeScript `~6.0.3` |
| Fonts | Outfit 400/500/600/700/900 via `@expo-google-fonts/outfit` |
| Motion libs | `react-native-reanimated 4.7.1` installed; only `Animated` (RN core) used so far |
| Visual libs | `expo-blur`, `expo-linear-gradient`, `expo-image`, `@expo/vector-icons`, `react-native-svg` |
| Storage | `expo-secure-store`, `@react-native-async-storage/async-storage` |
| Tests | **No test suite and no `test` script** (`package.json` scripts: start, android, ios, web, lint) |
| Checks available | `npm run lint` (`expo lint`), `npx tsc --noEmit` |

This is a **React Native mobile app**, not React DOM or Laravel Blade. All work
is done in RN/Expo source. No new framework or component library is introduced.

## 2. Route / screen inventory — VERIFIED

- `app/` contains **91 files**: 90 route files plus `app/_layout.tsx`.
- `app/(tabs)/`: `_layout.tsx`, `index.tsx` (role dashboard router), `admin.tsx`,
  `pagesat.tsx`, `profile.tsx`, `explore.tsx`.
- Root stack (`app/_layout.tsx`) registers ~85 screens including:
  - Auth: `intro`, `login`, `signup`, `forgot-password`, `two-factor`
  - Admin: `settings`, `club-profile`, `competitions`, `sezoni`, `fushat`,
    `perdoruesit`, `aktiviteti`, `raportet`, `raporti-ndeshjeve`
  - Team/players: `players`, `lista-lojtareve`, `lojtari`, `teams`, `ekipa`,
    `register-player`, `edit-player`, `player-statistics`, `player-profile`,
    `transferimet`, `coach-ratings`
  - Matches: `ndeshjet`, `ndeshja`, `fut-rezultatin`, `cakto-formacion`,
    `ndeshja-luajtur`, plus trainer and player variants
  - Training/academy: `stervitjet`, `stervitja`, `ushtrimet-trajner`,
    `akademia-trajner`, `libraria-trajner`, video screens, `taktik-bord-trajner`
  - Finance: `pagesa-lojtari`, `detajet-pageses`, `raporti-pagesave`,
    `kuotat-financierit`, `raportet-financiare`, `regjistro-pagesen-financierit`
  - Messaging: `mesazhet`, `mesazhet-trajner`, `biseda`
  - Parent: `femiu`, `profili-femiut`, `prezenca-femiut`, `vleresimet-femiut`,
    `kuotat-femiut`, `stervitjet-femiut`, `ndeshjet-femiut`
  - Legal/settings: privacy, terms, cookies, notification/security/subscription
- Five role dashboards: `admin-home`, `trainer-home`, `player-home`,
  `parent-home`, `financier-home` (2,700+ lines combined).

## 3. Design system as found — VERIFIED

- `constants/theme.ts` defines `ThemeColors`, `DarkColors`, `LightColors`,
  `Fonts`, `Spacing`, `Radius`.
- `lib/theme.tsx` provides `ThemeProvider` (persisted via
  `usePersistedState('theme:mode', 'dark')`) and `useThemedStyles`.
- `lib/responsive.ts` scales every numeric style by
  `(windowWidth / 440) * 1.1` via `scaled()` / `I()`.
- Light palette already uses **`#2E7D5B`** for `emerald` — the canonical brand
  anchor. Dark palette uses a mint-on-forest scheme.

### 3.1 Competing greens (problem) — VERIFIED
| Location | Green used |
|---|---|
| `constants/theme.ts` `LightColors.emerald` | `#2E7D5B` (brand anchor) |
| `app/login.tsx` local `C.green` | `#36AC6B` |
| `components/dashboard/*-home.tsx` local `C.green` | `#159447` |
| `components/dashboard/pill-tab-bar.tsx`, `trainer-pill-tab-bar.tsx` | `#159447` |

`#159447` on white is ≈ 3.3:1, below the 4.5:1 AA requirement for normal text.
`#2E7D5B` on white is ≈ 5.1:1 and passes. Unifying on the anchor is both a
brand and an accessibility fix.

### 3.2 Hard-coded values (problem) — VERIFIED
Local palette objects exist in `admin-home.tsx` (lines 37–61), `trainer-home.tsx`,
`player-home.tsx`, `parent-home.tsx`, `financier-home.tsx`, `login.tsx`,
both pill bars, `home-backdrop.tsx` (`#0e6f804b`), `filter-select.tsx`
(`#FFFFFF`, `#000000`), `app-background.tsx` (`FIELD = '#F5F5F5'`).
`constants/theme.ts` token usage is sparse: `mint` 7 files, `textMuted` 8,
`text` 4, `surface` 3, `emerald` 1. Low-risk to retune; high leverage.

### 3.3 Typography — VERIFIED
Single family (Outfit) with an ad-hoc scale: 9.5, 10, 11.5, 12, 12.5, 13,
13.5, 14, 16, 17, 18, 19, 20, 22, 24, 26, 30, 36. No shared type scale.

### 3.4 Radius / spacing — VERIFIED
`Radius` exists (8/12/16/24/999) but screens hard-code 4, 5, 6, 7, 8, 12, 16.
`Spacing` exists (4/8/12/16/24/32) but screens hard-code 9, 10, 11, 14, 18, 27.

## 4. Motion — VERIFIED

- Only `app/intro.tsx` (Animated stagger, `Easing.bezier(0.22,1,0.36,1)`) and
  `app/sezoni.tsx` (180 ms timing) animate anything.
- `react-native-reanimated` is installed but unused in app code.
- **No `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled`
  handling anywhere.**
- No motion tokens; durations are ad hoc.

## 5. Accessibility gaps — VERIFIED / INFERRED

- `app/login.tsx`: inputs use placeholders only, no visible labels and no
  `accessibilityLabel`; error is announced (`accessibilityRole="alert"`) ✓.
- Several icon-only `Pressable`s lack `accessibilityLabel`
  (e.g. `PillTabBar` route items have `accessibilityRole` but generic labels).
- Back control in `components/screen.tsx` is a 13 px text row; touch target is
  below 44 dp **INFERRED** (padding 4 dp + 22 px icon).
- No focus-ring styling for web/keyboard users **INFERRED** (RN-web relies on
  defaults; no explicit focus styles found).
- Reduced motion unsupported (see §4).
- Contrast: dashboard `#159447` text on white fails AA for normal text (§3.1).

## 6. Skills — VERIFIED

- No design skills installed in `C:\Users\PC\GoalHubApp\.claude\skills` or
  `~/.claude/skills`. `design-taste-frontend`, `frontend-design`,
  `web-design-guidelines` are **not installed** and are not claimed.
- `ui-ux-pro-max` was cloned to a temp directory and queried directly:
  `python src/ui-ux-pro-max/scripts/search.py "football club sports academy
  management dashboard mobile" --design-system -p "GoalHub"`.
  It returned *Vibrant & Block-based* with a red `#DC2626` palette. That
  conflicts with the supplied brand anchor `#2E7D5B`; the master spec makes the
  anchor canonical, so only its structural/motion/QA guidance is adopted.
  Its recommended display face (Bebas Neue) would add a font dependency, so the
  existing Outfit family is kept.

## 7. Git state and constraints — VERIFIED

Uncommitted pre-existing work that must be preserved:
`app.json`, `app/_layout.tsx`, `app/ushtrimet-trajner.tsx`,
`components/dashboard/home-backdrop.tsx`, `lib/api/drills.ts`, `package*.json`,
plus untracked tactical-board WebView work (`app/taktik-bord-trajner.tsx`,
`components/tactical-board/`, `constants/tactical-theme.ts`, `lib/tactical/`).
The redesign does not revert, reset, or delete any of it.

## 8. Verification environment — VERIFIED limitation

No browser-automation or screenshot tool is available in this session. Visual
verification of native screens is therefore **pending**. Verification evidence
used here is: `npx tsc --noEmit`, `npm run lint`, and an Expo bundle export.
WCAG contrast is verified by computed ratios (see DESIGN_SYSTEM.md §2).

## 9. Top problems, ranked

1. Three competing brand greens; sub-AA text on light surfaces.
2. Hard-coded palettes in all five dashboards + auth + navigation.
3. No motion language and no reduced-motion support.
4. No shared type/radius/spacing scale; inconsistent visual rhythm.
5. Missing form labels and weak touch targets on auth/back controls.
6. No shared button/card primitives, so states (hover/press/focus/disabled)
   differ per screen.
