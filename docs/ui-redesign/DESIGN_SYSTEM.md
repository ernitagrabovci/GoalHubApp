# GoalHub Design System (accepted)

Canonical brand anchor: **`#2E7D5B`**. Logo is not altered. Supporting tones
are derived from the anchor; green is never the only success signal.

## 1. Brand ramp

| Token | Hex | Use |
|---|---|---|
| `Brand[50]` | `#F0F8F4` | Brand wash, selected rows |
| `Brand[100]` | `#D9EEE2` | Soft highlight, active capsule |
| `Brand[200]` | `#B5DCC6` | Borders, decorative accents |
| `Brand[300]` | `#86C4A2` | Decorative only (not text on white) |
| `Brand[400]` | `#58A77E` | Dark-theme primary, non-text accents |
| `Brand[500]` | `#398F68` | Secondary brand tone |
| `Brand[600]` | `#2E7D5B` | **Primary actions, links, focus** |
| `Brand[700]` | `#256649` | Hover / pressed primary |
| `Brand[800]` | `#1D513B` | Active, deep brand surfaces |
| `Brand[900]` | `#143B2B` | Deep brand backgrounds |

Exports: `Brand`, `BrandAliases` in `constants/theme.ts`.

## 2. Semantic and neutral tokens

Light theme (`LightColors`):

| Role | Hex | Contrast evidence |
|---|---|---|
| canvas | `#F7F9F8` | — |
| surface | `rgba(255,255,255,0.80)` | cards over wallpaper |
| surface-muted | `#EFF3F1` | — |
| border | `#DCE5DF` | — |
| text-primary | `#17251E` | 15.05:1 on canvas ✓ |
| text-secondary | `#52645A` | 5.97:1 on canvas ✓ |
| text-muted | `#5F7268` | 4.85:1 on canvas / 4.58:1 on surface-muted ✓ |
| brand | `#2E7D5B` | 5.00:1 on white ✓ |
| on-brand | `#FFFFFF` | 5.00:1 on brand ✓ |
| success | `#15803D` | 5.02:1 on white ✓ (distinct from brand) |
| warning | `#B45309` | 5.02:1 on white ✓ |
| danger | `#B91C1C` | 6.47:1 on white ✓ |
| info | `#1D4ED8` | 6.70:1 on white ✓ |
| focus-ring | `#2E7D5B` | — |

Soft semantic surfaces: `successSoft #DCFCE7`, `warningSoft #FEF3C7`,
`dangerSoft #FEE2E2`, `infoSoft #DBEAFE`.

Dark theme (`DarkColors`): canvas `#0A1512`, text `#E6F4EC` (16.40:1 ✓),
secondary `#A9C9B8`, muted `#7FA494` (6.77:1 ✓), primary `#B9E7D0`
(13.65:1 ✓), brand `#58A77E`, success `#4ADE80`, warning `#FBBF24`,
danger `#F87171`, info `#60A5FA`.

Contrast was computed with the WCAG 2.x relative-luminance formula; ratios are
reproducible (see CHANGELOG evidence).

## 3. Typography

Family: Outfit (existing; no new font dependency).

| Role | Size / line | Weight token |
|---|---|---|
| display | 34 / 40, −0.8 | `heading` (700) |
| title | 28 / 34, −0.6 | `heading` |
| h2 | 22 / 28, −0.4 | `headingSemiBold` (600) |
| h3 | 18 / 24, −0.2 | `headingSemiBold` |
| body | 15 / 22 | `body` (400) |
| body-sm | 13 / 18 | `body` |
| label | 12 / 16, 0.2 | `bodySemiBold` |
| overline | 10 / 14, +1.2, uppercase | `bodySemiBold` |

`TypeScale` is exported from `constants/theme.ts`. Existing deliberate
lowercase wordmarks stay as-is.

## 4. Spacing, radius, elevation

- Spacing (4-pt base): 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Radius: `sm 8`, `md 12`, `lg 16`, `xl 24`, `pill 999`. Interactive rows and
  cards use `lg`; inputs and buttons use `md`; avoid values below `sm` except
  inside compact data tables.
- Elevation (`Elevation` export): `sm` for list rows, `md` for floating cards,
  `lg` for the nav pill and modals. Shadows stay low-opacity; elevation is
  never the sole affordance.

## 5. Motion

Exports in `lib/motion.ts`:

| Token | Value | Used for |
|---|---|---|
| `Motion.fast` | 140 ms | press feedback, icon swaps |
| `Motion.standard` | 200 ms | tab capsule, row press, fades |
| `Motion.complex` | 300 ms | modal / drawer / accordion |

- Enter: ease-out `cubic-bezier(0.22, 1, 0.36, 1)`.
- Exit: ease-in `cubic-bezier(0.4, 0, 1, 1)`.
- Only `opacity` and `transform` are animated (`useNativeDriver: true`).
- Never animate large tables on every render; no looping/decorative motion.
- `useReducedMotion()` mirrors `AccessibilityInfo.isReduceMotionEnabled` and
  subscribes to changes. When reduced, durations collapse to 0 and press
  feedback falls back to an instant opacity change — final state is identical.

### Motion inventory (implemented this batch)

| Surface | Motion |
|---|---|
| Buttons / rows / nav items | scale 0.97 + opacity 0.85 on press, 140 ms |
| Bottom nav active capsule | background cross-fade + icon scale, 200 ms |
| Screen back control | press feedback |
| Auth primary button | press feedback, spinner while busy |
| Charts | (TODO) animate fill once on mount |

## 6. Component patterns

- `AppButton` (`components/ui/app-button.tsx`): variants `primary`,
  `secondary`, `ghost`, `danger`; sizes `sm`/`md`/`lg`; min height 44 dp for
  `md`/`lg`; loading spinner; disabled opacity 0.5; `accessibilityRole="button"`,
  `accessibilityState={{ disabled, busy }}`.
- `AnimatedPressable` (`components/ui/animated-pressable.tsx`): shared press
  physics; respects reduced motion.
- `SurfaceCard` (`components/ui/surface-card.tsx`): themed glass surface with
  `lg` radius, hairline brand border, optional accent rail.
- `Screen` / `BrandHeader` / `SectionLabel` / `DetailHead` / `StatCell`
  (`components/screen.tsx`): app shell with 44 dp back target, consistent
  spacing and type scale.
- `ListRow` (`components/list-row.tsx`): animated row, `lg` radius, brand
  tinted tiles, 44 dp minimum height.
- Forms: every input has a visible label above it; errors use
  `accessibilityRole="alert"` and danger token.
- Chips/badges: text label always accompanies color; color is never the only
  meaning.

## 7. Responsive rules

- Primary target: 360–440 dp portrait (app is portrait-locked except the
  tactical board).
- The dashboards scale fixed-dp layouts by width (`lib/responsive.ts`); do not
  add a max-width to them without a layout redesign.
- Other screens use fluid flex layouts with 16 dp page padding.
- Long labels: `numberOfLines` + `flexShrink` or wrapping; no clipping.
  Verified by type check only this batch; visual QA pending.

## 8. Accessibility rules (from master spec + ui-ux-pro-max checklist)

- No emoji as icons (existing app uses vector icons ✓).
- 44 dp minimum touch target for primary controls.
- Visible focus for keyboard/web (`focusRing` token; RN-web).
- Text contrast ≥ 4.5:1 on light surfaces (§2 evidence).
- `prefers-reduced-motion` / reduce-motion respected (§5).
- Text/chips/badges reflow without clipping; no horizontal overflow.
- Charts and role badges always pair color with a label.
