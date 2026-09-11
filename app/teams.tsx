import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';
import { TEAMS, type Team } from '@/lib/teams';

/**
 * Lista e ekipeve — opened from the admin dashboard's "Ekipet → Shiko të
 * gjitha". Same light #FAFBFA canvas as the other sub-pages: four orange
 * summary squares, the "+ Ekipi i ri" control, the team cards inside a thin
 * green frame, the transfers banner, the sideways-scrolling statistics table
 * and a second green frame where each team shows its win/loss/goal figures.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  thBg: '#E7F1F8',
  rowLine: 'rgba(100,140,190,0.22)',

  green: '#159447',
  greenLine: '#7DCB9E',
  red: '#E03131',
  blue: '#1749B8',
  blueBtn: '#86BCFD',
  blueSoft: '#E3EEFB',
  orange: '#E4A000',
  amber: '#DDA15E',
  amberFill: '#F4E9DB',
};

const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  { label: 'Ekipet gjithsej', value: '5', hint: 'Kategori aktive' },
  { label: 'Lojtarët total', value: '85', hint: 'Të gjitha ekipet' },
  { label: 'Nr. i trajnerëve', value: '5', hint: 'Staf teknik' },
  { label: 'Sezoni aktual', value: '2025/2026', hint: 'Aktiv' },
];

type Col = { key: string; label: string; width: number; color?: string };

const STAT_COLS: Col[] = [
  { key: 'team', label: 'Ekipi', width: 92 },
  { key: 'players', label: 'Lojtarët', width: 64 },
  { key: 'nd', label: 'ND', width: 44 },
  { key: 'f', label: 'F', width: 40, color: C.green },
  { key: 'h', label: 'H', width: 40, color: C.red },
  { key: 'b', label: 'B', width: 40 },
  { key: 'gp', label: 'Gola+', width: 56 },
  { key: 'gm', label: 'Gola-', width: 56 },
  { key: 'diff', label: 'Diferenca', width: 76 },
];

const STAT_ROWS = 4;

/** Two per row, with the odd last card keeping its half width. */
function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type ModalState = { title: string; team?: Team };

export default function TeamsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
        </View>

        {/* Pinned header */}
        <View style={styles.header}>
          <View style={styles.colPad}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Kthehu prapa"
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title}>Lista e ekipeve</Text>
                <Text style={styles.subtitle}>FC Prishtina - Sezoni 2025/2026</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* ── Summary squares — one row, deliberately overflowing right ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryRow}
            bounces={false}
          >
            {SUMMARY.map((s) => (
              <View key={s.label} style={styles.sq}>
                <Text style={styles.sqLabel}>{s.label}</Text>
                <Text
                  style={styles.sqValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {s.value}
                </Text>
                <Text style={styles.sqHint}>{s.hint}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.colPad}>

            {/* ── Ekipi i ri ───────────────────────────────────── */}
            <Pressable
              onPress={() => setModal({ title: 'Krijo ekip' })}
              accessibilityRole="button"
              accessibilityLabel="Shto ekip të ri"
              style={({ pressed }) => [styles.newTeam, pressed && styles.pressed]}
            >
              <View style={styles.newTeamPlus}>
                <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.newTeamText}>Ekipi i ri</Text>
            </Pressable>

            {/* ── Team cards ───────────────────────────────────── */}
            <View style={styles.frame}>
              {chunkPairs(TEAMS).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((team) => (
                    <TeamCard
                      key={team.name}
                      team={team}
                      onEdit={() => setModal({ title: 'Edito ekip', team })}
                      onOpen={() =>
                        router.push(`/ekipa?name=${encodeURIComponent(team.name)}`)
                      }
                    />
                  ))}
                  {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
                </View>
              ))}
            </View>

            {/* ── Transferimet ─────────────────────────────────── */}
            <View style={styles.transfer}>
              <Image source={IMG_BALL} style={styles.transferImgLeft} resizeMode="contain" />
              <Image source={IMG_BALL} style={styles.transferImgRight} resizeMode="contain" />

              <Text style={styles.transferTitle}>Transferimet</Text>

              <Pressable
                onPress={() => router.push('/transferimet')}
                accessibilityRole="button"
                accessibilityLabel="Hap transferimet"
                style={({ pressed }) => [styles.transferBtn, pressed && styles.pressed]}
              >
                <Text style={styles.transferBtnText}>Vazhdo</Text>
              </Pressable>
            </View>

            {/* ── Statistika ───────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Statistika</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {STAT_COLS.map((c) => (
                      <Text
                        key={c.key}
                        style={[styles.th, { width: c.width }, c.color ? { color: c.color } : null]}
                      >
                        {c.label}
                      </Text>
                    ))}
                  </View>

                  {Array.from({ length: STAT_ROWS }).map((_, i) => (
                    <View key={i} style={[styles.tr, styles.trBorder]} />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Team records ─────────────────────────────────── */}
            <View style={[styles.frame, styles.frameGreen]}>
              {chunkPairs(TEAMS).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((team) => (
                    <TeamRecordCard key={team.name} team={team} />
                  ))}
                  {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {modal ? (
        <TeamModal title={modal.title} team={modal.team} onClose={() => setModal(null)} />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function TeamCard({
  team,
  onEdit,
  onOpen,
}: {
  team: Team;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={styles.teamCard}>
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamSeason}>{team.season}</Text>

      <View style={styles.teamDivider} />

      <View style={styles.teamRow}>
        <Text style={styles.teamLabel}>Trajneri</Text>
        <Text style={styles.teamValue} numberOfLines={1}>
          {team.coach}
        </Text>
      </View>
      <View style={styles.teamRow}>
        <Text style={styles.teamLabel}>Lojtarët</Text>
        <Text style={styles.teamValue}>{team.players}</Text>
      </View>

      <View style={styles.teamBtns}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
        >
          <Text style={styles.editBtnText}>Edito</Text>
        </Pressable>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ekipaBtn, pressed && styles.pressed]}
        >
          <Text style={styles.ekipaBtnText}>Ekipa</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TeamRecordCard({ team }: { team: Team }) {
  return (
    <View style={[styles.teamCard, styles.recordCard]}>
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamSeason}>{team.season}</Text>

      <View style={styles.teamDivider} />

      <View style={styles.recordRow}>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.green }]}>{team.win}</Text>
          <Text style={styles.recordLabel}>Fitore</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.red }]}>{team.loss}</Text>
          <Text style={styles.recordLabel}>Humbje</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.blue }]}>{team.goalsPlus}</Text>
          <Text style={styles.recordLabel}>Gola</Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit popup                                                 */
/* ------------------------------------------------------------------ */

function TeamModal({
  title,
  team,
  onClose,
}: {
  title: string;
  team?: Team;
  onClose: () => void;
}) {
  const [name, setName] = useState(team?.name ?? '');
  const [season, setSeason] = useState(team?.season ?? '2025/2026');
  const [coach, setCoach] = useState(team?.coach ?? '');
  const [assistant, setAssistant] = useState('');

  return (
    <View style={styles.ovWrap}>
      <BlurView style={styles.ovFill} intensity={45} tint="dark" />
      <Pressable
        style={[styles.ovFill, styles.ovDim]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Mbylle dritaren"
      />

      <View style={styles.popCard}>
        <View style={styles.popHeader}>
          <Text style={styles.popTitle}>{title}</Text>
        </View>
        <View style={styles.popDivider} />

        <View style={styles.popBody}>
          <View style={styles.popGridRow}>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Emri i ekipit:</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Sezoni:</Text>
              <TextInput
                value={season}
                onChangeText={setSeason}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
          </View>

          <View style={styles.popGridRow}>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Trajneri kryesor:</Text>
              <TextInput
                value={coach}
                onChangeText={setCoach}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Asistenti i trajnerit:</Text>
              <TextInput
                value={assistant}
                onChangeText={setAssistant}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
          </View>

          <Text style={styles.popLabel}>Ngjyra e ekipit:</Text>
          <View style={styles.swatchOuter}>
            <View style={styles.swatchInner} />
          </View>
        </View>

        <View style={styles.popActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.popBtn, styles.popCancel, pressed && styles.pressed]}
          >
            <Text style={styles.popBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.popBtn, styles.popCreate, pressed && styles.pressed]}
          >
            <Text style={styles.popBtnText}>Krijo</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: C.page,
      paddingTop: 2,
      paddingBottom: 12,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backBtn: {
      height: 34,
      justifyContent: 'center',
      marginLeft: -8,
      paddingRight: 10,
    },

    headerText: {
      flex: 1,
      justifyContent: 'center',
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: C.text,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 46,
    },

    /* ── Summary squares ─────────────────────────────────────── */
    summaryRow: {
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 8,
      gap: 8,
    },

    sq: {
      width: 114,
      height: 110,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: C.orange,
      borderRadius: 8,
      padding: 11,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    sqLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 4,
    },

    /* ── + Ekipi i ri ────────────────────────────────────────── */
    newTeam: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      height: 36,
      paddingLeft: 5,
      paddingRight: 14,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    newTeamPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    newTeamText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#000000',
    },

    /* ── Thin green frame around the team cards ──────────────── */
    frame: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: C.greenLine,
      borderRadius: 8,
      padding: 8,
      gap: 8,
    },

    frameGreen: {
      marginTop: 16,
    },

    gridRow: {
      flexDirection: 'row',
      gap: 8,
    },

    gridSpacer: {
      flex: 1,
    },

    teamCard: {
      flex: 1,
      minHeight: 132,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
    },

    teamName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 18,
      letterSpacing: -0.3,
      color: C.text,
    },

    teamSeason: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 1,
    },

    teamDivider: {
      width: '80%',
      height: 1,
      backgroundColor: '#000000',
      marginTop: 6,
      marginBottom: 6,
    },

    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 3,
    },

    teamLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    teamValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 15,
      color: C.text,
      textAlign: 'right',
    },

    teamBtns: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 'auto',
      paddingTop: 8,
    },

    editBtn: {
      height: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueBtn,
      borderRadius: 3,
    },

    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#FFFFFF',
    },

    ekipaBtn: {
      height: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blueBtn,
      borderRadius: 3,
    },

    ekipaBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.blueBtn,
    },

    /* ── Win / loss / goals rows ─────────────────────────────── */
    recordCard: {
      minHeight: 104,
    },

    recordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },

    recordCol: {
      alignItems: 'center',
      flex: 1,
    },

    recordNum: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 19,
    },

    recordLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.gray,
      marginTop: 1,
    },

    /* ── Transferimet ────────────────────────────────────────── */
    transfer: {
      marginTop: 16,
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amberFill,
      borderWidth: 1.5,
      borderColor: C.amber,
      borderRadius: 7,
      overflow: 'hidden',
    },

    transferImgLeft: {
      position: 'absolute',
      left: -18,
      bottom: -42,
      width: 96,
      height: 96,
      zIndex: 0,
    },

    transferImgRight: {
      position: 'absolute',
      right: -18,
      bottom: -42,
      width: 96,
      height: 96,
      zIndex: 0,
      transform: [{ scaleX: -1 }],
    },

    transferTitle: {
      zIndex: 2,
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: '#000000',
    },

    transferBtn: {
      zIndex: 2,
      marginTop: 12,
      height: 32,
      paddingHorizontal: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amber,
      borderRadius: 4,
    },

    transferBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#FFFFFF',
    },

    /* ── Statistika table ────────────────────────────────────── */
    card: {
      marginTop: 16,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(30,40,35,0.10)',
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },

    tblInner: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
    },

    thRow: {
      backgroundColor: C.thBg,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    pressed: {
      opacity: 0.5,
    },

    /* ── Create / edit popup ─────────────────────────────────── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      alignItems: 'center',
      justifyContent: 'center',
      /* Centering happens above this padding, so the popup sits a
         little above the vertical middle. */
      paddingBottom: 150,
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    popCard: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    popHeader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },

    popTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.text,
    },

    popDivider: {
      height: 1,
      backgroundColor: C.greenLine,
    },

    popBody: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 4,
    },

    popGridRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },

    popCol: {
      flex: 1,
    },

    popLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      marginBottom: 5,
    },

    popInput: {
      height: 32,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    swatchOuter: {
      width: 34,
      height: 34,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },

    swatchInner: {
      width: 24,
      height: 24,
      borderRadius: 2,
      backgroundColor: C.green,
    },

    popActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 14,
      paddingTop: 12,
    },

    popBtn: {
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    popCancel: {
      backgroundColor: C.red,
    },

    popCreate: {
      backgroundColor: C.green,
    },

    popBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#FFFFFF',
    },
  }),
);
