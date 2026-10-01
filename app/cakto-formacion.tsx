import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Cakto formacion — opened from the button of the same name on the trainer's
 * upcoming-match page. The trainer calls each player up as Startues, Rezervë or
 * Jashtë, and can correct their position, then publishes the call-up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Both cards and every control are rimmed in a thin black line. */
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
  blue: '#0766D8',

  green10: 'rgba(21,148,71,0.10)',
  green20: 'rgba(21,148,71,0.20)',
};

/* A player's position, each in its own colour under their name. */
const POS_TONE: Record<string, string> = {
  Portier: C.blue,
  Mbrojtës: C.green,
  Mesfushor: C.orange,
  Sulmues: C.red,
};

const POSITIONS = ['Portier', 'Mbrojtës', 'Mesfushor', 'Sulmues'];

const ROLES = ['Jashtë', 'Startues', 'Rezervë'];

const STARTER_CAP = 11;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const SEASON_YEAR = '2026';

type Player = { nr: string; name: string; pos: string };

const SQUAD: Player[] = [
  { nr: '1', name: 'Luan Kryeziu', pos: 'Portier' },
  { nr: '2', name: 'Bekim Rexhepi', pos: 'Portier' },
  { nr: '3', name: 'Ilir Bytyqi', pos: 'Portier' },
  { nr: '4', name: 'Driton Demiri', pos: 'Portier' },
  { nr: '5', name: 'Dren Hyseni', pos: 'Mbrojtës' },
  { nr: '6', name: 'Bekim Shala', pos: 'Mbrojtës' },
  { nr: '7', name: 'Dardan Krasniqi', pos: 'Mbrojtës' },
  { nr: '8', name: 'Fisnik Berisha', pos: 'Mbrojtës' },
  { nr: '9', name: 'Jetmir Zeka', pos: 'Mbrojtës' },
  { nr: '10', name: 'Riad Hoxha', pos: 'Mbrojtës' },
  { nr: '11', name: 'Endrit Gashi', pos: 'Mbrojtës' },
  { nr: '12', name: 'Fatos Bytyqi', pos: 'Mesfushor' },
  { nr: '13', name: 'Endrit Hoxha', pos: 'Mesfushor' },
  { nr: '14', name: 'Genc Morina', pos: 'Mesfushor' },
  { nr: '15', name: 'Kujtim Gashi', pos: 'Mesfushor' },
  { nr: '16', name: 'Leart Berisha', pos: 'Mesfushor' },
  { nr: '17', name: 'Mergim Berisha', pos: 'Mesfushor' },
  { nr: '18', name: 'Blerim Krasniqi', pos: 'Mesfushor' },
  { nr: '19', name: 'Ardit Llapashtica', pos: 'Sulmues' },
  { nr: '20', name: 'Hamdi Shala', pos: 'Sulmues' },
  { nr: '21', name: 'Arbnor Zeka', pos: 'Sulmues' },
  { nr: '22', name: 'Dion Nimani', pos: 'Sulmues' },
  { nr: '23', name: 'Yll Demaku', pos: 'Sulmues' },
  { nr: '24', name: 'Narti Cerkini', pos: 'Sulmues' },
  { nr: '25', name: 'Erion Zeka', pos: 'Sulmues' },
];

const INSTRUCTIONS = [
  'Zgjedh Startues për 11 lojtarët kryesorë',
  'Zgjedh Rezervë për lojtarët e bankës',
  'Zgjedh Jashtë për lojtar të pa thirrur',
  'Kliko Publiko për t’i njoftuar lojtarët',
];

const CLOSED = 'Jashtë';

/** "AUG" → "Aug" for the readable date line. */
function monthName(mon: string): string {
  if (MONTHS.indexOf(mon.toUpperCase()) < 0) return mon;
  return mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase();
}

export default function SetFormationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    home?: string;
    away?: string;
    day?: string;
    mon?: string;
    time?: string;
  }>();

  const home = params.home ?? '';
  const away = params.away ?? '';
  /* The side we are not: the fixture is always listed with Prishtina in it. */
  const rival = home.includes('Prishtina') ? away : home;

  const day = `${params.day ?? ''} ${monthName(params.mon ?? '')} ${SEASON_YEAR}`.trim();
  const time = params.time ?? '';

  /* Every player starts outside the squad; the trainer calls them up. */
  const [roles, setRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(SQUAD.map((p) => [p.nr, CLOSED])),
  );
  const [positions, setPositions] = useState<Record<string, string>>(() =>
    Object.fromEntries(SQUAD.map((p) => [p.nr, p.pos])),
  );
  /* Only one dropdown is ever unrolled, and it floats over the rows below. */
  const [openKey, setOpenKey] = useState<string | null>(null);

  const roster = SQUAD.map((p) => ({
    ...p,
    pos: positions[p.nr] ?? p.pos,
    role: roles[p.nr] ?? CLOSED,
  }));

  const starters = roster.filter((p) => p.role === 'Startues').length;
  const reserves = roster.filter((p) => p.role === 'Rezervë').length;

  const summary = [
    { label: 'Startuesit', value: `${starters}/${STARTER_CAP}` },
    { label: 'Rezervat', value: `${reserves}` },
    { label: 'Jashtë', value: `${roster.length - starters - reserves}` },
  ];

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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {rival ? `Formacioni - vs ${rival}` : 'Formacioni'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {[day, time].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Përmbledhje / Udhëzimi ────────────────────────── */}
            <View style={styles.duo}>
              {/* The narrow one: the counts, then the publish button. */}
              <View style={[styles.card, styles.duoSmall]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={1}>
                    Përmbledhje
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.sumBody}>
                  {summary.map((s) => (
                    <View key={s.label} style={styles.sumRow}>
                      <Text style={styles.sumLabel} numberOfLines={1}>
                        {s.label}
                      </Text>
                      <Text style={styles.sumValue} numberOfLines={1}>
                        {s.value}
                      </Text>
                    </View>
                  ))}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Publiko formacionin"
                    style={({ pressed }) => [styles.publishBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.publishText} numberOfLines={1}>
                      Publiko formacionin
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* The wide one: how the three call-ups work. */}
              <View style={[styles.card, styles.duoWide]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={1}>
                    Udhëzimi
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.guideBody}>
                  {INSTRUCTIONS.map((line) => (
                    <Text key={line} style={styles.guideText}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Lojtarët e ekipit ─────────────────────────────── */}
            <View style={[styles.card, styles.cardGap, styles.rosterCard]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack} numberOfLines={1}>
                  Lojtarët e ekipit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.rosterBody}>
                {roster.map((p, i) => {
                  const roleKey = `${p.nr}:role`;
                  const posKey = `${p.nr}:pos`;
                  return (
                    <View
                      key={p.nr}
                      style={[
                        styles.tr,
                        i > 0 && styles.trBorder,
                        (openKey === roleKey || openKey === posKey) && styles.trOpen,
                      ]}
                    >
                      <View style={styles.who}>
                        <Text
                          style={styles.pName}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {p.name}
                        </Text>
                        <Text
                          style={[styles.pPos, { color: POS_TONE[p.pos] ?? C.hint }]}
                          numberOfLines={1}
                        >
                          {p.pos}
                        </Text>
                      </View>

                      <View style={styles.picks}>
                        <Pick
                          value={p.role}
                          options={ROLES}
                          width={78}
                          open={openKey === roleKey}
                          setOpen={(v) => setOpenKey(v ? roleKey : null)}
                          isOff={(option) =>
                            option === 'Startues' &&
                            starters >= STARTER_CAP &&
                            p.role !== 'Startues'
                          }
                          onChange={(v) => setRoles((prev) => ({ ...prev, [p.nr]: v }))}
                        />
                        <Pick
                          value={p.pos}
                          options={POSITIONS}
                          width={90}
                          open={openKey === posKey}
                          setOpen={(v) => setOpenKey(v ? posKey : null)}
                          onChange={(v) => setPositions((prev) => ({ ...prev, [p.nr]: v }))}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown                                                            */
/* ------------------------------------------------------------------ */

function Pick({
  value,
  options,
  width,
  open,
  setOpen,
  isOff,
  onChange,
}: {
  value: string;
  options: string[];
  width: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  isOff?: (option: string) => boolean;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`Zgjedh: ${value}`}
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(12)} color={C.text} />
      </Pressable>

      {open ? (
        <View style={styles.selOpts}>
          {options.map((o) => {
            const off = isOff?.(o) ?? false;
            const active = o === value;
            return (
              <Pressable
                key={o}
                disabled={off}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={o}
                style={[styles.selOpt, active && styles.selOptActive, off && styles.selOptOff]}
              >
                <Text
                  style={[styles.selOptText, active && styles.selOptTextActive]}
                  numberOfLines={1}
                >
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
      /* Room for the last row's dropdown, which hangs past the card. */
      paddingBottom: 110,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },

    headTextBlack: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Përmbledhje / Udhëzimi ───────────────────────────────── */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 14,
    },

    /* The square-ish one on the left, the wide one on the right. */
    duoSmall: {
      flex: 0.85,
    },

    duoWide: {
      flex: 1.3,
    },

    sumBody: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: C.blue1,
      paddingHorizontal: 8,
      paddingTop: 2,
      paddingBottom: 8,
    },

    sumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      height: 28,
    },

    sumLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.hint,
    },

    sumValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      color: C.text,
    },

    publishBtn: {
      minHeight: 28,
      marginTop: 8,
      paddingHorizontal: 6,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    publishText: {
      textAlign: 'center',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: C.text,
    },

    guideBody: {
      flex: 1,
      backgroundColor: C.blue1,
      paddingHorizontal: 9,
      paddingTop: 8,
      paddingBottom: 10,
      gap: 8,
    },

    guideText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.hint,
    },

    /* ── Lojtarët e ekipit ───────────────────────────────────── */
    /* No overflow clipping on this one: an unrolled dropdown hangs past the
       card's bottom edge, and would be cut off at the last rows. */
    rosterCard: {
      overflow: 'visible',
    },

    rosterBody: {
      backgroundColor: C.blue1,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },

    /* The name block stays at the top when a dropdown below it opens. */
    tr: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      minHeight: 58,
      paddingHorizontal: 9,
      paddingVertical: 12,
    },

    /* Every row but the first is ruled off from the one above it. */
    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    /* Lifts the whole row so its unrolled dropdown floats over the next ones. */
    trOpen: {
      zIndex: 30,
      elevation: 30,
    },

    who: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 24,
    },

    pName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
    },

    pPos: {
      marginTop: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
    },

    picks: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },

    /* ── Dropdown ────────────────────────────────────────────── */
    sel: {
      height: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 3,
    },

    selText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.text,
      marginRight: 2,
    },

    /* Floats over the rows below so opening it never pushes them down. */
    selOpts: {
      position: 'absolute',
      top: 28,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 3,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    selOpt: {
      height: 26,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },

    selOptActive: {
      backgroundColor: C.green10,
    },

    /* Startues, once the eleven are already named. */
    selOptOff: {
      opacity: 0.35,
    },

    selOptText: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.text,
    },

    selOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
