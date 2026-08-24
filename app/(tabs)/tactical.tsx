import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
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
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  DEFAULT_SCENES,
  FORMATION_SLOTS,
  TACTICAL_ROSTER,
  type TacticalScene,
} from '@/lib/data';

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

/** Formation-specific coaching notes so the analysis feels like it reacts to the shape. */
const AI_TIPS: Record<string, { suggest: string; scan: string }> = {
  '4-3-3': {
    suggest: 'The 4-3-3 gives you width up front. Hug the touchlines with the wingers and push the full-backs high to overload the flanks in possession.',
    scan: 'Vulnerability: the channel between your deepest CM and the full-back is exposed to diagonal runs. Tuck that CM inside when the ball is central.',
  },
  '4-4-2': {
    suggest: 'Keep the two strikers narrow and let the wide midfielders stretch play. When defending, compact the middle block and shift as one line.',
    scan: 'Vulnerability: the space between the midfield line and the strikers lets opponents receive between the lines. Push the whole block up together.',
  },
  '3-5-2': {
    suggest: 'Your wing-backs are the main width. With the ball they stay high; without it they drop into a back five to protect the flanks.',
    scan: 'Vulnerability: the channel behind the wing-backs is open on transitions. The nearest CM should drop to cover on the counter.',
  },
  '4-2-3-1': {
    suggest: 'The double pivot protects the back line. Let the CAM drift into the space between the opponent lines to link midfield and attack.',
    scan: 'Vulnerability: the half-space on the side of the less mobile pivot is open. Shift the entire block toward the ball side in defence.',
  },
};

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
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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
            borderColor: selected ? Colors.mint : 'rgba(9,20,19,0.45)',
          },
        ]}>
        <Text style={styles.markerNum}>{p.number}</Text>
      </View>
      <Text style={styles.markerLabel}>{p.initials}</Text>
    </View>
  );
}

export default function TacticalScreen() {
  const [formation, setFormation] = useState('4-3-3');
  const [players, setPlayers] = useState<Placed[]>(() => buildPlayers('4-3-3'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pitchW, setPitchW] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [insight, setInsight] = useState(
    'Pick a formation, then drag players to build your plan. Save a scene to reuse it later.',
  );
  const [sceneName, setSceneName] = useState('');
  const [scenes, setScenes] = useState<TacticalScene[]>(DEFAULT_SCENES);

  const pitchH = pitchW * 1.5;

  const handleSelectFormation = (f: string) => {
    setFormation(f);
    setPlayers(buildPlayers(f));
    setSelectedId(null);
    setInsight(`${f} loaded — drag players to adjust.`);
  };

  const handleMove = useCallback((id: string, x: number, y: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  }, []);

  const selected = players.find((p) => p.id === selectedId) ?? null;

  const handleSaveScene = () => {
    const name = sceneName.trim() || `${formation} plan`;
    const scene: TacticalScene = {
      id: `${Date.now()}`,
      name,
      formation,
      players: players.map((p) => ({ id: p.id, x: p.x, y: p.y })),
    };
    setScenes((prev) => [scene, ...prev]);
    setSceneName('');
  };

  const handleLoadScene = (scene: TacticalScene) => {
    const base = buildPlayers(scene.formation);
    if (scene.players.length > 0) {
      setPlayers(
        base.map((b) => {
          const saved = scene.players.find((sp) => sp.id === b.id);
          return saved ? { ...b, x: saved.x, y: saved.y } : b;
        }),
      );
    } else {
      setPlayers(base);
    }
    setFormation(scene.formation);
    setSelectedId(null);
    setInsight(`Loaded “${scene.name}”.`);
  };

  const handleDeleteScene = (id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  const tips = AI_TIPS[formation] ?? AI_TIPS['4-3-3'];

  const onPitchLayout = (e: LayoutChangeEvent) => {
    setPitchW(e.nativeEvent.layout.width);
  };

  const boxH = (ratio: number) => ratio * pitchH;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dragging}
        keyboardShouldPersistTaps="handled">
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>goalhub</Text>
          </View>
        </View>

        {/* Screen head */}
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: `${Colors.mintDim}22` }]}>
            <IconSymbol name="map.fill" size={26} color={Colors.mintDim} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.title}>tactical board</Text>
            <Text style={styles.subtitle}>build a formation, then drag players on the pitch</Text>
          </View>
        </View>

        {/* Formation picker */}
        <Text style={styles.sectionLabel}>formation</Text>
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
                <Text style={styles.attackText}>▲ attack</Text>
              </View>
              {players.map((p) => (
                <PlayerMarker
                  key={p.id}
                  p={p}
                  width={pitchW}
                  height={pitchH}
                  dragging={dragging}
                  selected={p.id === selectedId}
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
              <Text style={styles.selectedHint}>drag on the pitch to move · {formation}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.insightCard}>
          <IconSymbol name="query-stats" size={18} color={Colors.mintDim} />
          <Text style={styles.insightText}>{insight}</Text>
          <View style={styles.insightActions}>
            <Pressable
              style={styles.insightBtn}
              onPress={() => setInsight(`${tips.suggest}`)}>
              <IconSymbol name="bolt.fill" size={14} color={Colors.mint} />
              <Text style={styles.insightBtnText}>AI suggest</Text>
            </Pressable>
            <Pressable
              style={styles.insightBtn}
              onPress={() => setInsight(`${tips.scan}`)}>
              <IconSymbol name="warning" size={14} color={Colors.warning} />
              <Text style={[styles.insightBtnText, { color: Colors.warning }]}>
                vulnerability scan
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Save scene */}
        <View style={styles.saveBar}>
          <TextInput
            style={styles.saveInput}
            placeholder="Scene name…"
            placeholderTextColor={Colors.textMuted}
            value={sceneName}
            onChangeText={setSceneName}
          />
          <Pressable style={styles.saveBtn} onPress={handleSaveScene}>
            <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.saveBtnText}>save</Text>
          </Pressable>
        </View>

        {/* Saved scenes */}
        <Text style={styles.sectionLabel}>saved scenes</Text>
        {scenes.length === 0 ? (
          <Text style={styles.emptyText}>No scenes yet — save one to reuse it.</Text>
        ) : (
          <View style={styles.sceneList}>
            {scenes.map((scene) => (
              <View key={scene.id} style={styles.sceneRow}>
                <View style={styles.sceneInfo}>
                  <Text style={styles.sceneName}>{scene.name}</Text>
                  <Text style={styles.sceneMeta}>{scene.formation} · {scene.players.length} players</Text>
                </View>
                <Pressable style={styles.sceneAction} onPress={() => handleLoadScene(scene)} hitSlop={8}>
                  <IconSymbol name="arrow.right" size={18} color={Colors.mint} />
                </Pressable>
                <Pressable style={styles.sceneAction} onPress={() => handleDeleteScene(scene.id)} hitSlop={8}>
                  <IconSymbol name="trash" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
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
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  pitchOuter: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pitchActive: {
    borderColor: Colors.mint,
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
    color: Colors.mintDim,
    marginTop: 2,
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.text,
  },
  selectedHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  insightCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  insightText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
  },
  insightBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.mint,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  saveInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  sceneList: {
    gap: Spacing.sm,
  },
  sceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sceneInfo: {
    flex: 1,
    gap: 2,
  },
  sceneName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  sceneMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  sceneAction: {
    padding: Spacing.xs,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
