import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { DEFAULT_SCENES, FORMATION_SLOTS, TACTICAL_ROSTER } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

const FORMATIONS = Object.keys(FORMATION_SLOTS);

const GRASS = '#0E2A1E';
const LINE = '#3A7A58';
const MARKER = 34; // diameter of the player chip

type Placed = {
  id: string;
  initials: string;
  number: number;
  name: string;
  color: string;
  x: number;
  y: number;
};

/** Reads the actual board and returns data-driven coaching notes for that shape. */
function analyzeBoard(players: Placed[]): { suggest: string; scan: string } {
  const def = players.filter((p) => p.y >= 0.66);
  const atk = players.filter((p) => p.y < 0.33);
  const left = players.filter((p) => p.x < 0.33).length;
  const right = players.filter((p) => p.x > 0.67).length;
  const centre = players.length - left - right;

  const defXs = def.map((p) => p.x);
  const defSpread = defXs.length > 1 ? Math.max(...defXs) - Math.min(...defXs) : 0;

  let suggest: string;
  if (atk.length >= 3) {
    suggest = `${atk.length} players stay high in the final third — you are set up to press and win the ball up the pitch. Keep the wide players tight to the touchline.`;
  } else if (atk.length === 0) {
    suggest = 'Nobody occupies the final third. Push a midfielder into the space between the lines to link midfield and attack.';
  } else {
    suggest = `${atk.length} player${atk.length === 1 ? ' is' : 's are'} in the final third. Add a second runner so the front line is not isolated against the centre-backs.`;
  }

  let scan: string;
  if (def.length <= 2) {
    scan = `Only ${def.length} player${def.length === 1 ? '' : 's'} in the defensive third — the back line is thin for counters. Ask a pivot to screen in front of the centre-backs.`;
  } else if (defSpread > 0.6) {
    scan = `The defensive line is stretched across ${Math.round(defSpread * 100)}% of the pitch width, leaving the wide centre-back exposed in 1v1s. Tuck the line together.`;
  } else if (left > right || right > left) {
    const side = left > right ? 'left' : 'right';
    scan = `You overload the ${side} side (${Math.max(left, right)} vs ${Math.min(left, right)}). Ask the weak-side player to hold their position to keep the shape.`;
  } else {
    scan = `The shape is balanced side to side with ${centre} central. Keep the block compact when the ball is lost.`;
  }

  return { suggest, scan };
}

function buildPlayers(formation: string): Placed[] {
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  return TACTICAL_ROSTER.map((r, i) => ({
    id: r.initials,
    initials: r.initials,
    number: r.number,
    name: r.name,
    color: r.color,
    x: slots[i].x,
    y: slots[i].y,
  }));
}

function PlayerMarker({
  p,
  width,
  height,
  dragging,
  selected,
  editable = true,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
}: {
  p: Placed;
  width: number;
  height: number;
  dragging: boolean;
  selected: boolean;
  editable?: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const wRef = useRef(width);
  const hRef = useRef(height);
  const baseRef = useRef({ x: p.x, y: p.y });
  const moveRef = useRef(onMove);
  const selectRef = useRef(onSelect);
  const dragStartRef = useRef(onDragStart);
  const dragEndRef = useRef(onDragEnd);

  useEffect(() => {
    wRef.current = width;
    hRef.current = height;
  });
  useEffect(() => {
    moveRef.current = onMove;
    selectRef.current = onSelect;
    dragStartRef.current = onDragStart;
    dragEndRef.current = onDragEnd;
  });
  // Only re-anchor the drag baseline when idle — while dragging, the handler
  // computes from the grant-time position so mid-drag re-renders must not move it.
  useEffect(() => {
    if (!dragging) {
      baseRef.current = { x: p.x, y: p.y };
    }
  }, [p.x, p.y, dragging]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editable,
      onMoveShouldSetPanResponder: () => editable,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        baseRef.current = { x: p.x, y: p.y };
        selectRef.current(p.id);
        dragStartRef.current();
      },
      onPanResponderMove: (_e, g) => {
        const nx = Math.min(0.97, Math.max(0.03, baseRef.current.x + g.dx / wRef.current));
        const ny = Math.min(0.97, Math.max(0.03, baseRef.current.y + g.dy / hRef.current));
        moveRef.current(p.id, nx, ny);
      },
      onPanResponderRelease: () => dragEndRef.current(),
      onPanResponderTerminate: () => dragEndRef.current(),
    }),
  ).current;

  return (
    <View
      {...pan.panHandlers}
      style={[
        styles.markerWrap,
        { left: p.x * width - 20, top: p.y * height - MARKER / 2 },
      ]}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: p.color,
            borderColor: selected ? colors.mint : 'rgba(9,20,19,0.45)',
          },
        ]}>
        <Text style={styles.markerNum}>{p.number}</Text>
      </View>
      <Text style={styles.markerLabel}>{p.initials}</Text>
    </View>
  );
}

export default function TacticalEditorScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { user } = useSession();
  const viewer = user?.role === 'player' || user?.role === 'parent';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const source = DEFAULT_SCENES.find((s) => s.id === id);

  const [formation, setFormation] = useState(source?.formation ?? '4-3-3');
  const [players, setPlayers] = useState<Placed[]>(() => {
    const base = buildPlayers(source?.formation ?? '4-3-3');
    if (source && source.players.length > 0) {
      return base.map((b) => {
        const saved = source.players.find((sp) => sp.id === b.id);
        return saved ? { ...b, x: saved.x, y: saved.y } : b;
      });
    }
    return base;
  });
  const [name, setName] = useState(source?.name ?? '');
  const [shared, setShared] = useState(source?.shared ?? false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pitchW, setPitchW] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [insight, setInsight] = useState(t('tacticalEditor.insightInitial'));

  const pitchH = pitchW * 1.5;

  const handleSelectFormation = (f: string) => {
    setFormation(f);
    setPlayers(buildPlayers(f));
    setSelectedId(null);
    setInsight(`${f} loaded — drag players to adjust.`);
  };

  const handleMove = useCallback((pid: string, x: number, y: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === pid ? { ...p, x, y } : p)));
  }, []);

  const selected = players.find((p) => p.id === selectedId) ?? null;

  const handleSave = () => {
    const sceneName = name.trim() || (source ? source.name : `${formation} plan`);
    alert(t(shared ? 'tacticalEditor.alertSavedShared' : 'tacticalEditor.alertSaved', { name: sceneName }));
    router.back();
  };

  const onPitchLayout = (e: LayoutChangeEvent) => {
    setPitchW(e.nativeEvent.layout.width);
  };

  const boxH = (ratio: number) => ratio * pitchH;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dragging}
        keyboardShouldPersistTaps="handled">
        {/* Back header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <IconSymbol name="chevron-left" size={22} color={colors.mint} />
          </Pressable>
          <View style={styles.headerBody}>
            <Text style={styles.headerTitle}>{t('tactical.title')}</Text>
            <Text style={styles.headerSub}>
              {viewer ? t('tacticalEditor.subShared') : source ? t('tacticalEditor.subEdit') : t('tacticalEditor.subNew')}
            </Text>
          </View>
          {viewer ? (
            <View style={styles.viewTag}>
              <IconSymbol name="visibility" size={14} color={colors.mintDim} />
            </View>
          ) : (
            <Pressable
              style={[styles.shareBtn, shared && styles.shareBtnOn]}
              onPress={() => setShared((v) => !v)}>
              <IconSymbol name="square.and.arrow.up" size={15} color={shared ? colors.textOnPrimary : colors.mint} />
              <Text style={[styles.shareText, shared && styles.shareTextOn]}>
                {t(shared ? 'tacticalEditor.shared' : 'tacticalEditor.share')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Scene name */}
        {viewer ? (
          <View style={styles.nameStatic}>
            <Text style={styles.nameStaticText}>{name.trim() || t('tacticalEditor.untitled')}</Text>
            <Text style={styles.nameStaticSub}>
              {t('tactical.metaPlayers', { formation, count: players.length })}
            </Text>
          </View>
        ) : (
          <TextInput
            style={styles.nameInput}
            placeholder={t('tacticalEditor.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        )}

        {/* Formation picker */}
        {viewer ? null : (
          <>
            <Text style={styles.sectionLabel}>{t('tacticalEditor.formation')}</Text>
            <View style={styles.chips}>
              {FORMATIONS.map((f) => {
                const active = f === formation;
                return (
                  <Pressable
                    key={f}
                    onPress={() => handleSelectFormation(f)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Pitch */}
        <View style={[styles.pitchOuter, dragging && styles.pitchActive]} onLayout={onPitchLayout}>
          {pitchW > 0 ? (
            <View style={[styles.pitch, { height: pitchH }]}>
              <View style={styles.outline} />
              <View style={[styles.midline, { top: pitchH / 2 }]} />
              <View
                style={[
                  styles.centerCircle,
                  { width: pitchW * 0.24, height: pitchW * 0.24, borderRadius: pitchW * 0.12, left: pitchW * 0.38, top: pitchH / 2 - pitchW * 0.12 },
                ]}
              />
              <View
                style={[
                  styles.penBox,
                  { height: boxH(0.16), width: pitchW * 0.62, left: pitchW * 0.19, top: 0 },
                ]}
              />
              <View
                style={[
                  styles.penBox,
                  { height: boxH(0.16), width: pitchW * 0.62, left: pitchW * 0.19, bottom: 0 },
                ]}
              />
              <View
                style={[
                  styles.goalBox,
                  { height: boxH(0.07), width: pitchW * 0.3, left: pitchW * 0.35, top: 0 },
                ]}
              />
              <View
                style={[
                  styles.goalBox,
                  { height: boxH(0.07), width: pitchW * 0.3, left: pitchW * 0.35, bottom: 0 },
                ]}
              />
              <View style={styles.attackTag}>
                <Text style={styles.attackText}>{t('tacticalEditor.attack')}</Text>
              </View>
              {players.map((p) => (
                <PlayerMarker
                  key={p.id}
                  p={p}
                  width={pitchW}
                  height={pitchH}
                  dragging={dragging}
                  selected={p.id === selectedId}
                  editable={!viewer}
                  onSelect={setSelectedId}
                  onMove={handleMove}
                  onDragStart={() => setDragging(true)}
                  onDragEnd={() => setDragging(false)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Selected player / analysis */}
        {selected ? (
          <View style={styles.selectedBar}>
            <View style={[styles.selectedDot, { backgroundColor: selected.color }]}>
              <Text style={styles.selectedDotText}>{selected.number}</Text>
            </View>
            <View style={styles.selectedBody}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedHint}>{t('tacticalEditor.selectedHint', { formation })}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.insightCard}>
          <IconSymbol name="query-stats" size={18} color={colors.mintDim} />
          <Text style={styles.insightText}>
            {viewer ? t('tacticalEditor.viewerInsight', { formation }) : insight}
          </Text>
          {viewer ? null : (
            <View style={styles.insightActions}>
              <Pressable
                style={styles.insightBtn}
                onPress={() => setInsight(analyzeBoard(players).suggest)}>
                <IconSymbol name="bolt.fill" size={14} color={colors.mint} />
                <Text style={styles.insightBtnText}>{t('tacticalEditor.aiSuggest')}</Text>
              </Pressable>
              <Pressable
                style={styles.insightBtn}
                onPress={() => setInsight(analyzeBoard(players).scan)}>
                <IconSymbol name="warning" size={14} color={colors.warning} />
                <Text style={[styles.insightBtnText, { color: colors.warning }]}>
                  {t('tacticalEditor.vulnScan')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {viewer ? null : (
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={colors.textOnPrimary} />
            <Text style={styles.saveBtnText}>{t('tacticalEditor.saveScene')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerBody: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'lowercase',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  shareBtnOn: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  shareText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  shareTextOn: {
    color: colors.textOnPrimary,
  },
  viewTag: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
  },
  nameStatic: {
    marginTop: Spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 2,
  },
  nameStaticText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  nameStaticSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  nameInput: {
    marginTop: Spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  pitchOuter: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pitchActive: {
    borderColor: colors.mint,
  },
  pitch: {
    width: '100%',
    backgroundColor: GRASS,
    position: 'relative',
  },
  outline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: LINE,
  },
  midline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: LINE,
  },
  centerCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  penBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  goalBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  attackTag: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  attackText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1,
    color: LINE,
    textTransform: 'uppercase',
  },
  markerWrap: {
    position: 'absolute',
    width: 40,
    height: 46,
    alignItems: 'center',
    zIndex: 10,
  },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerNum: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    color: '#091413',
  },
  markerLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: colors.mintDim,
    marginTop: 2,
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  selectedDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDotText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: '#091413',
  },
  selectedBody: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  selectedHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  insightCard: {
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  insightText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  insightActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  insightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
  },
  insightBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.mint,
  },
  saveBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
