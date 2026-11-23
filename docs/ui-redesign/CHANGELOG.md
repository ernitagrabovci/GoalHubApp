# UI Redesign Changelog

## 2026-11-23 — Dark-mode fix: menu-card titles were invisible

Intent: at the administrator's request, re-check the texts — the menu-card
grids showed no titles in dark mode.

### Root cause
The role home menus and two academy screens carry their card wash and rim as
raw pastel strings in module-level data, applied inline (`backgroundColor:
card.bg`). Those bypassed the palette, so the cards stayed light while their
titles/icons use `C.textText` (near-white in dark mode) — white on pastel.

### Fixed
- `lib/app-theme.ts` — new `useThemedColor()` maps a raw light literal through
  `DARK_BY_VALUE`/fallback (identity in light, so light output is unchanged).
  Added dark values for the remaining pastel pairs still carried raw:
  `#FFF2F2`/`#F6CFCF`/`#F6D5D5`/`#FBF0ED`/`#F0D2CC` (red washes),
  `#FDECF2`/`#F3C2D2` (pink), `#EFE9FB`/`#D9C9F2` (lavender),
  `#E7F6EC`/`#BFE7CD`/`#CCE6D6`/`#EBE8FA` (greens/lavender).
- `components/dashboard/trainer-home.tsx`, `components/dashboard/player-home.tsx`,
  `app/femiu.tsx`, `app/akademia-trajner.tsx` — card `bg`/`border` now go
  through `themed(...)`, so the washes darken and the titles read.
- `app/video-strategjike-trajner.tsx` — the clip cards' `skin.bg`/`skin.solid`
  go through `themed(...)` for the same reason.

`npx tsc --noEmit` and `npm run lint` pass. Device-verified dark mode on the
trainer/player/femiu menus, trainer academy and strategic-video grids; light
mode re-checked on the academy grid (original pastel values unchanged).

## 2026-11-23 — Settings: drop the "Administrimi" row

At the administrator's request the "Administrimi" row (route `/admin`) was
removed from the Settings menu (`app/settings.tsx`). The `/admin` screen and
the Admin tile in `lib/modules.ts` are untouched — only the duplicate entry
point in Settings is gone. `npx tsc --noEmit` and `npm run lint` pass.

## 2026-11-23 — Batch 14: dark-mode readability pass

Intent: fix the texts (and a few icons/rules) that bypassed the palette and
stayed dark on the dark page — reported on the admin home greeting/subtitle
("…e grupit tënd sot." in dark green) and elsewhere.

### Fixed
- `lib/app-theme.ts` — dark values for the raw text literals the homes and
  screens still drew directly: hero `rgba(12,37,27,.65/.7)`, `#3F5A50`,
  `#5B6663`, `#C25454`, `#4E6A5F`, `#2A5040`, `#1F6B4F`, `#3A3042`,
  `#3A3A3A`, `#1E1A45`, `#7B4F8E`, `#0F3D2E`, `#4A4A4A`, `#222222`,
  `#333333`, `#111111`, `#080808`, `#0A0A0A`, plus the pastel promo rims
  (`#E8F3FF`/`#C6E0FA`, `#F8EBD8`/`#F0D9AE`, `#FDEBEB`/`#F2C2C2`,
  `#FBF0DC`/`#EFD6A6`, `#E2F5E9`, `#DDF8E9`, `#E7E4FA`/`#C9C2ED`).
  New `chevron` key (`#7FA494`) for muted dropdown carets.
- `constants/dashboard-theme.ts` — `DashboardC` gains `heroMuted`, `heroSub`,
  `statLabel`, `statLabelSoft`, `statDownSub`, `statSubLabel`, `statSubValue`,
  `seeAll`, `teamRowName`, `teamName`, `featTitle`, `promoIcon`,
  `eventIconBg`, `chipAktivBg`, `featCardBg`, `featCardBorder`. Light values
  equal the previous literals; dark values come from `DARK_BY_VALUE`.
- Five role homes — greeting subtitle/club name, stat labels/subs, "Shiko të
  gjitha", team rows, event-icon tiles, parent active chip and financier
  feature card now read those roles.
- Screens: `fushat` (`fmTh`/`fmTd` table text, select caret),
  `akademia-lojtarit` badge, `raporti-pagesave` axis labels, `edit-player`
  error/loading colors (gained a small palette), `perdoruesit`,
  `detajet-pageses`, `ndeshjet-trajner` carets; `players` / `raportet` /
  `pagesat` pastel promo tiles; black avatar/chevron/star affordances in
  `lojtari`, `player-profile`, `profili-femiut`, `profili-lojtarit`; black
  rules in `coach-ratings`, `ekipa`, `teams`, `vleresimet-lojtareve`,
  `ndeshja-luajtur`, `ndeshja-luajtur-lojtarit`.
- Popups — `register-payment-modal`, `match-modals`, `injury-form`,
  `training-form` cards/option lists now use `MO.whiteFill` (dark surface);
  caret/ink roles for carets, the match preview and the payment checkbox.

### Checks
- `npx tsc --noEmit` → no output.
- `npm run lint` → no problems.

### Verified on device (`emulator-5554`, Expo Go, 1080×2400)
- Dark admin home: "Mirë se erdhe, Admin!" and the subtitle under it are
  light; stat labels/subs, "Shiko të gjitha", team rows and promo tiles all
  readable.
- Dark Fields screen + "Shto fushë" popup: card is a dark surface, weekday
  table head/rows and carets light.
- Dark Players, Raporti i pagesave (axis labels) and Lojtari detail (avatar
  glyph, chevron) readable.
- Light regression: admin home, Raporti i pagesave and Settings captured in
  light and unchanged from the pre-pass design.

### Not changed
- Tactical board screens keep their intentional dark-native styling.

## 2026-11-20 — Batch 13: Appearance (Pamja) + app-wide Light/Dark switching

Intent: ship the Settings Appearance control and make one theme manager drive
the whole app — screens, dashboards, tab bars, backdrop, status bar, and every
popup/modal — with switching applied instantly and the choice persisted.

### Added
- `lib/glass.ts` — `useGlass()` returns the frosted-pane vocabulary (`tint`,
  `gloss`, `sheen`, `highlight`, `sweep`, `sweepSoft`) for the active theme,
  read from `useTheme()`. Replaces the per-file `SQ_GLOSS` / `SQ_SHEEN`
  constants; light tuples are byte-for-byte the previous literals.
- `lib/theme.tsx` — `useTheme` / `setTheme` power the Appearance switch;
  preference is written to storage, so it survives navigation, app restarts
  and logout/login.
- `app/settings.tsx` — "Pamja" card above the account rows: Sun `Ndriçuar`
  and Moon `Errët` options with the active one checked and highlighted.
  Translation keys `settings.appearance/light/dark` in EN and SQ.

### Changed
- `lib/app-theme.ts` — expanded `DARK_BY_KEY` / `DARK_BY_VALUE` coverage
  (`text`, `ink`, `white`, `textOnPrimary`, `surface`, `surfaceAlt`,
  `borderSoft`, `glassBorder`, glass base/back/veil/edge/rim/divider) so the
  popup, filter and glass palettes map cleanly onto the dark page. Role
  aliases (`…Text` / `…Fill` / `…Border`) still equal the light value in light
  mode, so the light design is unchanged.
- `constants/dashboard-theme.ts` — `glassBase` / `glassEdge` / `glassDivider`
  added to `DashboardC`.
- 84 module screens (`app/*`), the five role dashboards, both pill tab bars
  and the home backdrop now read `useAppColors(…)` + `usePaletteStyles(…)`;
  every literal surface/text/border in their stylesheets was rewritten to a
  palette role through scripted passes, with `tsc`/lint green after each pass.
- Popup palettes: the 11 `const MO = {…}` files (`fushat`, `mesazhet`,
  `mesazhet-trajner`, `ndeshjet-trajner`, `njoftimet`, `perdorusit`, `sezoni`,
  `register-payment-modal`, `match-modals`, `injury-form`, `training-form`)
  became themed `MO_LIGHT` palettes; styles are memoised from the themed
  palette and every `MO.x` use now carries its text/fill/border role.
- Shared components themed the same way: `filter-select` (the stale
  "role dashboards ignore ThemeProvider" fixed-light branch is gone),
  `delete-player-modal`, `health-status-modal`, `delete-account-modal`,
  `player-form`, `legal-page`.
- `app/biseda.tsx`, `app/perdorusit.tsx`, `app/raportet-financiare.tsx`,
  `app/vleresimet-lojtareve.tsx` — glass backdrops and veils routed through
  palette keys (`glassBack`, `glassVeil`) instead of near-white literals.

### Checks
- `npx tsc --noEmit` → no output (run after each wave and on the final tree).
- `npm run lint` → no problems on the final tree.

### Verified on device (`Medium_Phone`, Expo Go, 1080×2400)
- Settings → `Ndriçuar` ⇄ `Errët` repaints the whole screen immediately; the
  chosen option shows its checkmark.
- Cold restart (`force-stop host.exp.exponent` → deep link) restores the saved
  Dark choice.
- Users list in dark: glass summary tiles, filter chips, search field, table
  and pagination all dark; **light regression** screenshot identical to the
  pre-change design.
- `FilterSelect` menu (Users, role filter) renders as a dark panel with light
  text.
- Fields screen → "Shto fushë" modal: card, inputs, weekday grid and toggles
  all themed in dark, and unchanged in light.

### Not device-captured
- The native `Modal` popups (`register-payment-modal`, `match-modals`,
  `injury-form`, `training-form`) and `player-form` / `legal-page` were
  sign-out-gated at capture time; they are compile-checked and use the same
  `MO_LIGHT` + role pattern as the Field modal that was verified.
- Tactical board screens keep their dark-native design by design.

## 2026-11-20 — Batch 12: close FND-03 / SHL-02, make `/admin` reachable

Intent: finish the two remaining IMPLEMENTED tasks honestly. The blocking gap
was evidentiary, not functional: `SurfaceCard`/`DetailHead` lived on the admin
menu, which sat in the tabs group as a hidden (`href: null`) route. Hidden tab
routes resolve neither by deep link nor by `router.push` — tapping
"Administrimi" in Settings bounced to the role home — so the menu could not be
device-verified and `lib/modules.ts`'s Admin grid entry was dead too.

### Fixed
- `app/(tabs)/admin.tsx` → `app/admin.tsx` — moved out of the tabs group to a
  root-stack route. Registered `<Stack.Screen name="admin">` in
  `app/_layout.tsx` and removed `admin` from `HIDDEN_ROUTES` in
  `app/(tabs)/_layout.tsx`. `/admin` now resolves from Settings and from the
  modules grid; the screen keeps its `Screen` shell, `DetailHead` and
  `SurfaceCard` sections unchanged. It renders without the bottom pill bar, as
  a menu page (consistent with other root routes).
- `app/settings.tsx` — new administrator-only "Administrimi" row
  (`view-grid-outline`, route `/admin`) above the club panels, with
  `settings.administration` added to `lib/translations.ts` (EN "Administration",
  SQ "Administrimi").
- `components/list-row.tsx` — `ListRow` and `DateTile` accept an optional
  `palette?: ThemeColors`; when omitted they keep using the global theme. This
  removes the fixed-light-screen blocker documented in SHL-02 without rewriting
  any module layout (verified as-is; no forced adoption).

### Verified on device
- 411 dp: admin home gear → Settings shows the new "Administrimi" row; tapping
  it opens the admin menu — DetailHead ("paneli i adminit"), all ten
  SurfaceCard sections, `lojtarët` expanded by default, tapping `ekipet`
  expands its three items, and tapping `ekipet` → Teams navigates. The earlier
  bounce-to-home is gone.
- `npx tsc --noEmit` and `npm run lint` exit 0.

### Status
- FND-03 → VERIFIED (secondary/ghost/danger variants, sm/lg sizes, spinner and
  accent rail remain compile/lint-verified only — no theme-aware consumer).
- SHL-02 → VERIFIED (FilterSelect adopted + device-verified; ListRow palette
  support added, no forced consumer).
- Weighted progress 46/46 = 100%; IMPLEMENTED 0/46.

## 2026-11-20 — Batch 11b: trainer/player/parent/finance touch-target pass

Intent: finish MOD-01's per-screen touch-target/typography pass in the screen
families Batch 11 did not reach. Same measured rules as the admin family —
44 dp real height for primary controls; dense row actions at 30 dp visual +
`hitSlop` to 44 effective; chips 36 + slop; dropdowns repositioned to follow
the taller fields.

### Fixed
- `app/raporti-ndeshjeve.tsx`, `app/kartela-mjeksore.tsx` — filter box 44,
  chips 36 + slop 4/2, dense row "Shiko" 30 + slop 7/4; medical-card pager
  arrows 20 dp icon with 8 slop (36 effective) → slop 12 (44).
- `app/njoftimet.tsx` — controls/rows/modal buttons to 44; `controlText` was
  `C.frame` on white (≈1.2:1) and now uses `C.text` (real contrast bug).
- `app/mjeku.tsx`, `app/(tabs)/pagesat.tsx` — row actions 30 + slop 7/4, add
  button 44; payment pager arrows slop 8→11.
- `app/detajet-lendimit.tsx`, `app/detajet-pageses.tsx`,
  `app/club-settings.tsx`, `app/club-profile.tsx`,
  `app/season-settings.tsx`, `app/fut-rezultatin.tsx`,
  `app/transferimet.tsx`, `app/regjistro-pagesen-financierit.tsx`,
  `app/subscription-settings.tsx`, `app/notification-settings.tsx`,
  `app/cookies-policy.tsx`, `app/ndeshja.tsx`, `app/ndeshja-luajtur.tsx` —
  inputs/selects/buttons 44 (radius 8–10), option rows 40, dropdown `top`
  re-offset, date boxes DD/MM/YYYY 36/60×44.
- `app/edito-material-trajner.tsx`, `app/ngarko-video-trajner.tsx`,
  `app/shto-material-trajner.tsx` — inputs/selects to 44 / 13.5;
  `shto-material-trajner`'s input was 38.
- `app/cakto-formacion.tsx` — 44-high roster select with padding 8 / 11.5 so
  "Startues" fits the fixed 78 dp column; option rows 40.
- `app/mesazhet.tsx` — compose-modal person rows 40→44 (matches
  `mesazhet-trajner`).
- `app/ndeshjet.tsx` — played-history "Shiko" was the only row action missing
  `hitSlop`; added (44 effective).
- `app/biseda.tsx`, `app/coach-ratings.tsx`, `app/mesazhet-trajner.tsx`,
  `app/vlereso-lojtarin.tsx`, `app/fushat.tsx` — chips/actions 30–36 + slop,
  bars 44, date boxes 44, injury time boxes slimmed to fit their circle.

### Verified on device
- 411 dp: `ndeshjet`, `players`, `kartela-mjeksore`, `raportet`,
  `mesazhet` + compose modal, `shto-material-trajner`, `cakto-formacion`
  (empty roster — per-player selects compile-verified only),
  `detajet-pageses`, `vlereso-lojtarin`. 360 dp: `vlereso-lojtarin`.
  440 dp: `shto-material-trajner`. No clipping at any width.
- `npx tsc --noEmit` and `npm run lint` exit 0.

### Status
- MOD-01 → VERIFIED. Weighted progress 41/46 ≈ 89.1%; IMPLEMENTED 5/46
  (FND-03, SHL-02).

## 2026-11-19 — Batch 11: admin module touch-target pass

Intent: MOD-01's remaining "per-screen touch target/typography pass". Batch 11
walks the admin module screens on the device, measures the controls, and fixes
what still fell under 44 dp — including dense table-row actions, which keep a
short visual height but gain `hitSlop` up to 44 dp without overlapping their
neighbours.

### Fixed
- `app/perdoruesit.tsx` — create/filter/search/pager/role-swap controls to
  44 dp (radius 8–10, text 12.5–14); create/edit/role modals to 44 dp inputs,
  selects and buttons; row actions 24→30 with `hitSlop` 7 top/bottom (44 dp
  effective); `ACTION_W` 182→216 so Edito/Çaktivizo/Fshi fit right-aligned;
  table header 10.5→11.5, cells 11→12.
- `app/ndeshjet.tsx` — team filter and Shto ndeshje 36→44; row buttons 24→30
  with hitSlop; pager squares 34→44; fonts raised. Device capture showed the
  `Rezultati`/`Veprimet` header labels colliding in 40/46 dp columns; widened
  to 58/60 and re-captured clean.
- `app/sezoni.tsx`, `app/competitions.tsx`, `app/fushat.tsx`,
  `app/raportet.tsx`, `app/mesazhet.tsx`, `app/lista-lojtareve.tsx`,
  `app/players.tsx`, `app/teams.tsx` — selects/buttons/inputs and dropdown
  options to 44 dp; dense row actions 30–36 + hitSlop to ≥44 dp; chips and
  pager squares 44; labels 12/16+, errors 12/15.

### Verified on device (411 dp emulator)
- `perdoruesit` — Krijo llogari 45 dp, filter chips 45 dp, search 46 dp,
  Kërko 45 dp (UI-automator bounds). Table scrolled right: all three row
  actions render without clipping. Create-user modal inputs/select and
  Anulo/Krijo ≥44 dp.
- `ndeshjet`, `sezoni`, `competitions`, `fushat`, `raportet`, `mesazhet`,
  `lista-lojtareve`, `players`, `teams` — each captured with no clipping;
  primary controls measure ≥44 dp.
- `ekipa`/`aktiviteti` audited only: their 34 dp back control already has
  `hitSlop={12}` (58 dp effective).
- `npx tsc --noEmit` and `npm run lint` clean after the column fix.

### Status
- MOD-01 stays IMPLEMENTED: the admin family is done; the trainer/player/parent
  screen families remain (Batch 7 already closed their primary actions).
  Weighted progress unchanged at 36/46 ≈ 78.3% verified; IMPLEMENTED 10/46
  (FND-03, SHL-02, MOD-01).

## 2026-11-19 — Batch 10: forms and modals verified

Intent: MOD-02 was marked IMPLEMENTED from a claim that its controls had been
raised to 44 dp. Batch 10 walks the representative forms/modals on the device
rather than trusting that claim — and several files still had 16–36 dp
controls.

### Fixed
- `components/players/player-form.tsx`
  - Date of birth was the only date field still typed free-form with a
    `YYYY-MM-DD` placeholder while the contract dates used DD / MM / YYYY.
    It now reuses the same `DateGroup`; parse on load and compose on submit
    are shared, so edit mode pre-fills 29 / 04 / 2010.
  - The two contract date groups overlapped by 36 px: each group was ~168 dp
    wide inside a ~156 dp half column. `dateSq` 40→36 and `dateYear` 66→56
    leave a 23 dp gutter (groups at 117–511 px, 571–964 px) and still fit a
    360 dp column after `scaled()` (~131 dp group vs ~136 dp column).
  - "Nr. i fanellës:" wrapped to two lines, then ellipsized when forced to
    one; shortened to "Nr. fanellës:" and `nrCol` 62→76.
- `components/settings/delete-account-modal.tsx` — action buttons 32→44,
  input 36→44, radius 8–12, error 12.5, a11y labels/state. Measured 45 dp.
- `app/account-settings.tsx` — inputs/selects 36→44, options 34→44, save
  40/42→44, danger actions 33→44, radius 10. Measured 45 dp.
- `app/security-settings.tsx` — 2FA field 40→44, panel/wipe/danger buttons
  34–36→44, radius 10, small text raised. Measured 45–46 dp.
- `app/(tabs)/pagesat.tsx` — filter/register controls 34→44, search 36→44,
  team options 30→44; dropdown offset 38→48. Measured 45 dp.
- `app/lojtari.tsx`, `app/player-profile.tsx` — health-status pill went from
  a 16 dp text trigger to 11 px text + padding + `hitSlop={10}` (46 dp).
- `app/notification-settings.tsx` — toggle `hitSlop` 8→10 (44 dp target).

### Verified on device (411 dp emulator)
- Training form modal — date/time groups, Anulo/Ruaj at 45 dp.
- Security 2FA panel — code input 46 dp, Anulo/Konfirmo 45 dp.
- Payment modal — selects/inputs/buttons 45 dp (already compliant).
- Player detail — health modal options 53 dp / Anulo 45 dp; delete-player
  modal 45 dp; edit form pre-fills dates with no overlap.
- Delete-account modal — 45 dp; account-settings page — 45 dp.
- `npx tsc --noEmit` and `npm run lint` clean.

### Status
- MOD-02 → VERIFIED. Weighted progress 36/46 ≈ 78.3% verified; remaining
  IMPLEMENTED: FND-03, SHL-02, MOD-01 (10/46).

## 2026-11-19 — Batch 9: shared-primitive adoption, auth consistency

Intent: FND-03/SHL-01/SHL-02 had been marked IMPLEMENTED because their
components "existed but were unadopted"; Batch 9 finds every structurally
compatible adoption site, migrates it, and closes AUTH-02 with real device
evidence.

### Adoption (FND-03, SHL-01)
- `app/(tabs)/index.tsx` — the signed-out CTA is now `AppButton`
  (`primary`, `md`, arrow icon) instead of a bespoke `Pressable`; it gains the
  component's `button` role, label and disabled/busy state and press motion.
  Captured on device at 411 dp.
- `app/(tabs)/admin.tsx` — the collapsible section cards now use
  `SurfaceCard padding="none"` instead of a hand-rolled surface style.
  This route is currently not reachable from the UI (see below), so the change
  is compile-verified only.
- `app/(tabs)/explore.tsx` — dropped its own `SafeAreaView` + `ScrollView` +
  brand row and renders through `Screen`; the signed-out modules screen was
  captured on device at 411 dp with the shell's brand header, hero and grid.
- Not adopted, deliberately: `ListRow` has no consumer. Module screens render
  dense table rows inside a shared card, and `ListRow` reads the global theme
  while every module screen is fixed light — adopting it would recreate the
  Batch 7 dark-menu leak. `FilterSelect` remains the shared filter control.

### AUTH-02 — signup / forgot-password consistency
- `app/signup.tsx` was entirely hardcoded English while login and
  forgot-password are Albanian. All copy (labels, placeholders, trial note,
  CTA, footer, every validation and API error) now goes through
  `useLanguage()`; new `signup.*` keys added to `lib/translations.ts` in both
  EN and SQ.
- Signup's submit button was an outlined light-green pill (radius 5, green
  text); it now matches login/forgot — filled brand, 52 dp, radius 12, white
  16 px label, white spinner, plus accessibility label and disabled/busy
  state.
- `app/forgot-password.tsx` — the only English string ("Send link") is now
  `t('forgot.send')` ("Dërgo linkun").
- 2FA lives in `security-settings` and already uses Albanian copy and token
  styles; no change needed.
- Captured on device at 411 dp: fully Albanian signup with the filled brand
  CTA, and the localized forgot button.

### Findings
- The `/admin` route is orphaned: it is listed in `lib/modules.ts` and the
  modules grid, but the grid sends a signed-out visitor to `/login`, the tab
  is hidden for signed-in users, and deep-linking a hidden tab route falls
  back to the initial route. Flagged for a navigation follow-up; not caused by
  this batch (the `SurfaceCard` change there is harmless either way).
- While signed in as admin, the "Profili" pill intentionally opens the
  full-screen `/club-profile` route (it mirrors the webapp), not the personal
  profile screen — expected behavior per `pill-tab-bar.tsx`.

### Device QA (emulator-5554, Expo Go, 411 dp unless noted)
- Signed-out home with the new `AppButton`; modules screen through `Screen`;
  admin home (four stat tiles, hairline dividers, brand wash, no clipped
  text); admin five-pill bar with the brand capsule and a working Pagesat tab
  switch (the bar hides on that screen by design); trainer three-pill bar with
  the capsule moving to
  Profili; with all Android animation scales at 0 the Profile → Home switch
  still updates the capsule and `selected=true` state instantly (scales
  restored to 1). The admin Pagesat tab also shows the Batch 8
  sideways-scroll hint added to `(tabs)/pagesat.tsx`. State left on trainer
  home (Kryesorja) at native density.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.

SHL-01, NAV-01, AUTH-02 and DSH-02 promoted to VERIFIED. Weighted progress
now 32/46 ≈ 69.6% (remaining IMPLEMENTED: FND-03, SHL-02, MOD-01, MOD-02).

## 2026-11-19 — Batch 8: finance/report/detail QA, table scroll affordances, web focus

Intent: close the QA-02 gaps left at the end of Batch 7 — finance, report,
detail and season screens, dark auth, and web keyboard focus — and fix what
the wider sweep uncovered.

### Device QA (signed in as the financier, finance@goalhub.com)
- Captured on emulator-5554 with `scripts/emulator-screenshot.ps1`:
  - `financier-home` at 440 / 390 / 360 dp — four glassy stat tiles, recent
    payments table and Pesat card all fit; no clipping.
  - `kuotat-financierit` at 440 / 390 / 360 dp.
  - `raportet-financiare` at 360 / 390 / 440 dp.
  - `raporti-pagesave` at 360 dp — the financier lacks the endpoint, so the
    page renders the role-denied state: "Nuk ke leje për këtë faqe. Kontakto
    administratorin." plus a 44 dp "Provo përsëri" retry.
  - `detajet-pageses-financierit` at 360 dp — Lojtari/Ekipi/Periudha/Shuma/
    Afati/Statusi/Data e pagesës/Metoda/Nr. faturës plus the green "Paguar"
    summary block; clean.
  - `sezoni` at 360 dp — header, competition picker, "+ Hap një sezon të re"
    and the stats card render; "Historia e sezoneve" shows the same 403 +
    retry strip.
  - `season-settings` at 360 dp — active-season card, "+ Sezoni i ri" and a
    3-column season table that fits (empty state).
- Finding: seven wide tables (6–11 fixed-width columns) clip at 360/390 dp
  with no scroll affordance. Added the shared "Rrëshqit anash për më shumë
  kolona" hint (same gesture icon + copy as `lista-lojtareve`/`mjeku`) above
  the table in: `app/(tabs)/pagesat.tsx`, `app/kuotat-financierit.tsx`,
  `app/raportet-financiare.tsx`, `app/kuotat-femiut.tsx`, `app/raportet.tsx`,
  `app/pagesa-lojtari.tsx`, `app/historiku-prezences-trajner.tsx`. The hint is
  `accessibilityElementsHidden` so it does not add screen-reader noise.
- The floating gear seen on finance screens is Expo Go's dev "Tools" bubble
  (content-desc `Tools`), an overlay of the dev client, not app UI; no change.

### Web keyboard focus
- Ran the web build (`npx expo start --web --port 8082`, react-native-web) and
  drove headless Edge over CDP at 390×844.
- On `/login`, Tab cycles Email → Fjalëkalimi → "Harrove fjalëkalimin?" →
  "Identifikohu" → "Regjistrohu" and wraps. Every stop is a real
  input/button/link with `outline: auto 1px`; the two inputs additionally show
  the brand focus glow (`box-shadow rgba(46,125,91,0.18)`). Screenshot
  (`web-focus.png`) and the focus log (`web-focus.json`) captured.

### Dark auth
- The auth flow is fixed light by design: the persisted `theme:mode` (dark)
  does not apply to `/login`, so no dark auth capture exists. Auth contrast is
  covered by the computed pairs in DESIGN_SYSTEM §2. The signed-out landing
  still carries the dark tab bar noted in Batch 7.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.

AUTH-01, MOD-03 and QA-02 promoted to VERIFIED on the evidence above.
Weighted progress now 22/46 ≈ 47.8%.

## 2026-11-19 — Batch 7: device QA pass, touch targets, filter theme leak

Intent: run the visual QA that was previously blocked, fix what it found, and
close the remaining sub-44 dp primary controls.

### Device QA (emulator-5554, Expo Go, 1080 px wide)
- Captured real screenshots at 360 / 390 / 440 dp (`wm density` 480 / 443 /
  393) plus the native 411 dp (`420`). Method: `scripts/emulator-screenshot.ps1`
  (`screencap` + `pull`, magic-byte checked) — never `exec-out` redirection.
- Players list at all three widths: the squad grid is wider than a phone and
  clips at 360/390 dp, but it scrolls horizontally and shows the "Rrëshqit
  anash për më shumë kolona" hint; it fits fully by 440 dp. Intended behavior,
  left as is. Profile and messages render clean at 360 and 440 dp; matches
  table fits at 360 dp.
- Reduced motion: set `animator/transition/window_duration_scale=0`, reloaded
  the app, and opened the filter menu — it jumps straight to its final frame
  and stays usable. Restored all scales to 1 afterward.

### Fixes found by QA
- `components/filters/filter-select.tsx` — the dropdown read the global
  `ThemeProvider` palette (dark) while every screen that uses it is fixed
  light, so the menu opened as a dark panel with a near-invisible chevron.
  It now uses the light palette its consumers are built on; the menu surface
  is the opaque `surfaceAlt` so rows do not ghost through it.
- Touch targets below 44 dp on primary actions, raised with `hitSlop` (no
  visual/layout change): `ndeshjet`, `stervitjet`, `libraria-trajner`,
  `planet-sesioneve-trajner`, `video-strategjike-trajner`, `mjeku`,
  `ndeshja-trajner`, `season-settings`, `mesazhet`, `mesazhet-trajner`,
  `filter-select`; `competitions` add button raised 42→44 dp. Dense report
  grids keep their 9–9.5 px cells on purpose (360 dp row wrapping).
- `app/lista-lojtareve.tsx` — summary card label 9.5→10 px.
- `app/mjeku.tsx` — the injury grid scrolls sideways at 360 dp but had no
  affordance; added the same "Rrëshqit anash për më shumë kolona" hint used on
  the players list.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npx expo export --platform android` → `entry-*.hbc` (6.1 MB).
- FND-02 promoted to VERIFIED on the reduced-motion device test above.
  Weighted progress now 13/46 ≈ 28.3% (FND-01, FND-02, DSH-01, QA-01).

## 2026-11-18 — Batch 6: palette leftovers + device QA unblocked

Intent: finish the legacy-color cleanup the post-gate sweeps started, and
record that device screenshots are now possible so QA-02 is no longer fully
blocked.

### Palette
- The glass stat-card rim was still the legacy orange `#BC6C25` in
  `trainer-home`, `player-home`, `financier-home`, and `parent-home`; all four
  now use the shared `C.statBorder` (`Brand[300]`), matching `admin-home` and
  the green brand ramp. Removed the now-stale "orange rim" comment in
  `admin-home`.
- Earlier sweeps on the same tree: `#0C251B` → `C.text` (9 dashboard
  occurrences) and text `#000000` → `#17251E`. Grep for `#0C251B` /
  `#BC6C25` across `*.{ts,tsx,js,jsx}` now returns zero.

### Device QA (Android emulator, Expo Go)
- Why screenshots showed stale UI: the emulator cannot reach the host LAN IP
  (`ws://192.168.10.147:8081` times out from `192.168.232.2`), so Expo Go was
  running a cached bundle (`hot=false`). Loading via
  `adb reverse tcp:8081 tcp:8081` + `exp://127.0.0.1:8081` serves the current
  bundle from Metro.
- Captured the trainer dashboard at 1080×2400: bottom-nav labels do not wrap,
  the active pill and inactive labels read clean, and all four stat labels and
  values fit their columns after zoom inspection.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.

## 2026-11-18 — Batch 5: permission-denied copy (MOD-03)

Intent: a 403 used to reach the user as "check your connection" (or Laravel's
English "This action is unauthorized"). Role denials now read as what they are
— a permission problem with a next step — while every 401 path is unchanged.

### Central change
- `lib/api/client.ts` — a non-2xx 403 now carries
  "Nuk ke leje për këtë faqe. Kontakto administratorin." in `ApiError.message`,
  so every screen that renders `err.message` (the local `errorText` helpers)
  gets sensible copy without touching it.
- `lib/api/errors.ts` — new `loadErrorMessage(error, fallback)`: maps status 0
  to the connection copy and 403 to the permission copy, otherwise returns the
  caller's fallback. Screens that build their own fallback strings use this
  instead of an inline `status === 0` ternary.

### Adopted `loadErrorMessage`
`lista-lojtareve`, `stervitjet`, `ndeshjet`, `mesazhet`, `raportet`,
`aktiviteti`, `njoftimet` + the four role inboxes, `kuotat-financierit`,
`pagesa-lojtari`, `raportet-financiare`, `(tabs)/pagesat`,
`raporti-ndeshjeve`, `raporti-pagesave`, `historiku-prezences-trajner`,
`regjistro-prezencen`, `sezoni` (settled-results reason), `player-home`,
`parent-home`. `raportet-financiare` also lost its copy-pasted "kuotat"
fallback.

### Dashboards
- The five role-home failure strips now hold the actual message
  (`loadError` is a string, not a boolean), so a denied feed says why.
- `transferimet` gained an explicit 403 branch on submit.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npx expo export --platform android` → `entry-*.hbc` (6 MB); `.export-check`
  removed.

### Not done / limitations
- Not every screen was migrated off its inline fallback; those that show
  `err.message` are already covered by the client change. Remaining inline
  branches are on screens outside the MOD-03 state-surface set.
- No visual/device verification (QA-02 still BLOCKED).

## 2026-11-18 — Batch 4: dashboard failure surfaces (MOD-03)

Intent: the five role homes fetch several independent feeds; until now a
non-401 failure either vanished (admin, trainer, financier) or appeared as a
bare line (player, parent). Each home now shows one compact failure strip under
the greeting with a 44 dp "Provo përsëri" that refetches every feed. No route,
API call, or success-path layout changed.

### Modified files
- `components/dashboard/admin-home.tsx` — `loadError`/`reloadKey`; any
  rejected feed in the `Promise.allSettled` sets the flag; the "leaves its
  section empty" comment now explains the banner; strip uses the shared
  surface/border tokens.
- `components/dashboard/trainer-home.tsx` — `handleAuthError` became
  `handleFail` (401 → sign-out, otherwise raise the flag); retry re-runs all
  four reads.
- `components/dashboard/financier-home.tsx` — a rejected totals/paid/badges
  read raises the flag; retry re-runs the settled batch.
- `components/dashboard/player-home.tsx` — `reloadKey`; the existing `error`
  string moved from the fixtures row into the strip; the fixtures row is back
  to plain "Nuk ka ndeshje të ardhshme."
- `components/dashboard/parent-home.tsx` — retry added to the child-list error;
  the strip sits where the bare error line was, above the cards.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npx expo export --platform android` → `entry-*.hbc` (6 MB); `.export-check`
  removed.

### Not done / limitations
- No visual/device verification (QA-02 still BLOCKED).
- The homes still show "—"/empty values while a feed is in flight; a skeleton
  pass was not attempted without visual QA.
- Auth / permission-denied states remain the last MOD-03 item.

## 2026-11-18 — Batch 3: list-screen state surfaces (MOD-03)

Intent: give the two table screens real loading/empty/error states with a
retry path, and lift the compressed table type. No logic, route, API or state
semantics changed.

### Modified files
- `app/lista-lojtareve.tsx` — `loading`/`loadError`/`reload` state; three-state
  table body (spinner + "Duke ngarkuar lojtarët…", error + 44 dp "Provo
  përsëri", "Nuk u gjet asnjë lojtar."); `th`/`td` 11/14 → 12/16; "Shiko"
  hitSlop 10.
- `app/stervitjet.tsx` — same three-state body ("Duke ngarkuar stërvitjet…",
  "Nuk ka stërvitje për këta filtra."); card count shows "—" while loading;
  `td` 11/14 → 12/16 (`th` already 11/14).
- `app/ndeshjet.tsx` — the placeholder "…" became an `ActivityIndicator` +
  "Duke ngarkuar ndeshjet…" in both tables; the error branch gained a 44 dp
  "Provo përsëri" that clears the error and refetches both lists; error copy
  now names the connection.
- `app/mesazhet.tsx` — `loading`/`loadError` state on the conversation fetch;
  spinner + "Duke ngarkuar bisedat…" and error + retry replace the bare empty
  row until data arrives; polling leaves the loaded list untouched.
- `app/raportet.tsx` — loading caption beside the existing spinner, 44 dp
  "Provo përsëri" in the error branch (`reload` state added to the effect),
  connection hint in the error copy.
- `app/perdoruesit.tsx` — `loading`/`loadError` state on the users fetch;
  spinner / error + retry / "Nuk u gjet asnjë përdorues." inside the table
  frame, rows hidden while loading or failed.
- `app/transferimet.tsx` — retry control raised from 30 dp to 44 dp (brand
  outline, 13 px label); spinner caption added.
- `app/sezoni.tsx` — `loading`/`loadError` state for the season fetch; spinner,
  error + retry, "Nuk ka sezone ende." empty text, `reload` bumped on retry.
- `app/aktiviteti.tsx` — retry in the activity error box, loading caption.
- `app/njoftimet.tsx` — both notice tables show a spinner while `list` is
  null and a retry button on failure; the literal "…" placeholders are gone.
- `app/njoftimet-{trajner,lojtarit,prindit,financierit}.tsx` — same spinner /
  empty / error+retry treatment on the four role inboxes (each file edited
  independently, per the role-page convention).
- `app/(tabs)/pagesat.tsx`, `app/kuotat-financierit.tsx`,
  `app/pagesa-lojtari.tsx`, `app/raportet-financiare.tsx` — the "…" row in
  each fees table is now a spinner + caption, and the error row gained a
  44 dp retry (each screen got a `reload`/`version` bump path).
- `app/(tabs)/profile.tsx` — parent children card shows a spinner while
  loading and a retry button on failure; new `common.retry` and
  `profile.loadingChildren` strings in `lib/translations.ts` (EN + SQ).
- `app/raporti-ndeshjeve.tsx`, `app/raporti-pagesave.tsx` — `reload` state in
  the report effect; error copy names the connection; the error branch gained a
  44 dp "Provo përsëri"; spinner caption "Duke përgatitur raportin…".
- `app/historiku-prezences-trajner.tsx` — error / loading / empty now share one
  state row under the table head; retry refetches and resets the page data;
  spinner caption "Duke ngarkuar historikun…".
- `app/regjistro-prezencen.tsx` — the attendance sheet gained a real load
  state: spinner row "Duke ngarkuar listën e lojtarëve…", error row with a
  44 dp retry (hidden when the route id is invalid), and an explicit empty row
  ("Nuk ka lojtarë për këtë stërvitje."); the lone error line under the table
  was removed so failures surface at the sheet itself.
- Both: the refetch reset moved out of the effect body into the filter-change
  and retry handlers, satisfying `react-hooks/set-state-in-effect`. Filters now
  call `onTeamChange`/`onPositionChange` and `onTypeChange`/`onStatusChange`.

### Audited, no change needed
- `components/chart.tsx` — already token-only (no hard-coded hex); `StatBar`
  ships the reduced-motion-aware `scaleX` animation from Batch 1.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npx expo export --platform android` → `entry-*.hbc` (6 MB); `.export-check`
  removed.
- Re-run after the report / attendance-history / attendance-sheet edits:
  tsc clean, lint clean, export `entry-*.hbc` (6 MB), `.export-check` removed.

### Not done / limitations
- No visual/device verification (QA-02 still BLOCKED).
- Dashboard feeds and the remaining module screens still use inline empty
  branches; MOD-03 remains IN_PROGRESS.

## 2026-11-18 — Batch 2: forms, modals, module palette sweep

Intent: finish the shared form/modal pass and migrate the remaining legacy
palette literals in module screens onto the brand palette. No logic, routes,
API calls or state changes.

### Forms / modals (MOD-02 — IMPLEMENTED)
- `components/players/player-form.tsx` — Brand/Semantic palette, 44 dp inputs
  and selects, 10–12 radii, 14 px input text, 44 dp option rows, 48 dp action
  buttons, accessibility labels on every field, `expanded`/`selected` states.
- `components/trainings/training-form.tsx` — token palette, 44 dp select/date
  boxes, 14 px fields, 96×44 buttons, field rows 44 dp, a11y labels for
  date/time/notes, select states.
- `components/medical/injury-form.tsx` — same treatment; date boxes 44 dp with
  per-field labels derived from the visible label.
- `components/finance/register-payment-modal.tsx` — token palette, 44 dp
  pickers/checkboxes/date boxes/buttons, 20 px checkbox, labelled period rows
  and pickers.
- `components/players/health-status-modal.tsx` — token tones (brand/semantic),
  12 px radius, 52 dp options, 44 dp cancel, selected/disabled state.
- `components/players/delete-player-modal.tsx` — token palette, 12 px radius,
  44 dp buttons, white-on-danger text.

### Module screens (MOD-01 — IN_PROGRESS)
- Controlled literal sweep over 91 `.tsx` files under `app/` and `components/`:
  old greens → `#2E7D5B`, old reds → `#B91C1C`, amber → `#B45309`, muted text
  → `#52645A`, body text → `#17251E`, page/card tints → `#F7F9F8`/`#FFFFFF`,
  black frames and input borders → `#DCE5DF`, modal accent greens → Brand
  100/200 tints. Shadows (`#000000`) and icon fills left untouched.
- Remaining for MOD-01: per-screen layout/touch-target/typography pass.

### Checks
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npx expo export --platform android` → `entry-*.hbc` (6 MB) exported;
  `.export-check` removed.

### Not done / limitations
- No visual/device verification (QA-02 still BLOCKED).
- Dense table screens still carry small type and compact controls; enlarging
  them safely needs the blocked layout QA.

## 2026-11-18 — Batch 1: tokens, motion, primitives, shell, nav, auth, dashboards

Intent: land the foundation (tokens/motion/primitives) and apply it to the
shared shell, navigation, auth flow and all five role dashboards without
changing any business logic, route, API call or state semantics.

### New files
- `constants/theme.ts` additions — `Brand` ramp anchored on `#2E7D5B`,
  `Semantic` (success/warning/danger/info + soft tints), extended `ThemeColors`
  (`brand`, `brandSoft`, `brandStrong`, `brandTint`, `success`, `successSoft`,
  `warningSoft`, `dangerSoft`, `infoSoft`, `focusRing`, `shadow`, `overlay`),
  `TypeScale`, `Elevation`.
- `lib/motion.ts` — `Motion` (fast 140 / standard 200 / complex 300), `Easings`,
  `useReducedMotion()` (AccessibilityInfo + subscription), `usePressMotion()`,
  `useNavFocus()`.
- `components/ui/animated-pressable.tsx` — press physics wrapper.
- `components/ui/app-button.tsx` — primary/secondary/ghost/danger, sm/md/lg,
  loading/disabled, accessibility state. (Not yet adopted.)
- `components/ui/surface-card.tsx` — glass surface card. (Not yet adopted.)
- `constants/dashboard-theme.ts` — single `DashboardC` palette + `NavC`.
- `components/dashboard/nav-pill-item.tsx` — shared nav item with animated
  capsule/icon, badge, `accessibilityState={{ selected }}`.

### Modified files
- `components/screen.tsx` — animated 44 dp back control, `DetailHead` surface +
  elevation, `TypeScale.h2`.
- `components/list-row.tsx` — `AnimatedPressable`, 56 dp min row, AA colors,
  accessibility role/label.
- `components/filters/filter-select.tsx` — theme tokens, entrance animation,
  `expanded`/`selected` states, 44 dp menu items.
- `components/dashboard/pill-tab-bar.tsx`,
  `components/dashboard/trainer-pill-tab-bar.tsx` — map to `NavPillItem`, `NavC`,
  badges/full-screen/nav logic unchanged.
- `components/dashboard/home-backdrop.tsx` — `DashboardC.bg`.
- `components/dashboard/{admin,trainer,player,parent,financier}-home.tsx` —
  local palettes deleted, all consume `DashboardC`.
- `components/dashboard/admin-home.tsx` — text colors unified, radii 7→12,
  hairline dividers, promo/activity card borders.
- `app/login.tsx` — brand tokens, visible labels, focus ring, error box,
  entrance stagger, `AnimatedPressable`. Logic preserved (`auth.login`, 2FA
  challenge redirect, `completeSignIn`).
- `app/signup.tsx` — brand tokens, visible labels + `accessibilityLabel`,
  50 dp / radius 12 fields.
- `app/forgot-password.tsx` — brand tokens, `accessibilityLabel="Email"`,
  44 dp back target, 50 dp fields/primary.
- `app/two-factor.tsx` — brand tokens, 44 dp back target, 50 dp field/primary.
- `components/chart.tsx` — `StatBar` `scaleX` animation (`Motion.complex`,
  `transformOrigin: 'left'`, reduced-motion aware).
- `components/settings/delete-account-modal.tsx`,
  `components/matches/match-modals.tsx` — token palette, neutral text, danger
  token, input borders.

### Fixes made during the batch
- Replaced `useRef(new Animated.Value()).current` with
  `useState(() => new Animated.Value())` in login, chart, filter-select,
  motion hooks — resolves React Compiler `react-hooks/refs` lint errors.
- Corrected a malformed `'#BFC DC5'.replace(...)` literal in match-modals.

### Checks (all run on the final tree)
- `npx tsc --noEmit` → no output.
- `npm run lint` → no errors.
- `npx expo export --platform android --output-dir .export-check` → bundle
  `entry-*.hbc` (6 MB); directory deleted afterwards.

### Not done / limitations
- No device/browser visual pass (QA-02 BLOCKED — no capture tool in session).
- `AppButton`/`SurfaceCard` built but unused; adoption is MOD-01/MOD-02 work.
- Module list screens, remaining forms/modals, and chart state surfaces still
  pending (MOD-01/02/03).

## 2026-11-18 — Batch 0: discovery, docs, task plan

- Read `AGENT_START_PROMPT.md` and `UI_REDESIGN_MASTER.md`.
- Audited stack, routes, theme, motion, accessibility, git state.
- Cloned `ui-ux-pro-max` to a temp dir and ran its design-system query; adopted
  structure/motion/QA guidance only, kept the master-spec brand anchor.
- Added `docs/ui-redesign/{AUDIT,DESIGN_SYSTEM,TASKS,CHANGELOG}.md`.
- Created native task list mirroring TASKS.md.

No application code changed in this batch.

### Evidence
- `git status --short`, `git diff --stat`: pre-existing uncommitted tactical
  board work identified and left untouched.
- `python src/ui-ux-pro-max/scripts/search.py … --design-system` output
  captured (red palette rejected per master spec §1).
- Contrast script (WCAG relative luminance) run for candidate tokens.
