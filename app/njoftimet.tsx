import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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

/**
 * The admin's system notifications — opened from the bell in the home header.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Cards are two-tone: a lighter title strip over a deeper body. */
  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  /* The row table sits on the palest card, where the faint rule above washes
     out — its rules go darker instead. */
  tableLine: 'rgba(0,0,0,0.35)',

  blue: '#2F80ED',
  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  green: '#159447',
  red: '#E03131',
};

/** Popup palette — the same white card and green rim the other dialogs use. */
const MO = {
  border: '#159B63',
  divider: '#55B88B',
  title: '#080808',
  text: '#111111',
  sub: '#666666',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  cancel: '#ED5050',
  create: '#16A51D',
  white: '#FFFFFF',
};

/** Who a new notification can go to, once "Të gjithë klubin" is ruled out. */
const FILTER_TEAMS = ['Ekipi i Parë', 'U21', 'U19', 'U17', 'U15', 'U13'];
const FILTER_ROLES = ['Lojtarë', 'Trajner', 'Prindër'];

type Target = 'all' | 'filter';

/** Gloss sweep laid over the frosted squares — bright corner, pale middle. */
const SQ_GLOSS = [
  'rgba(255,255,255,0.78)',
  'rgba(255,255,255,0.16)',
  'rgba(255,255,255,0.46)',
] as const;

/* Every square reads label / number / unit, so the count stays the loud part. */
const SUMMARY = [
  { label: 'Njoftime të palexuara', value: '0', hint: 'Nga sistemi', tone: C.red },
  { label: 'Njoftime të dërguara sot', value: '0', hint: 'njoftime', tone: C.green },
  { label: 'Njoftimet këtë muaj', value: '0', hint: 'dërgime', tone: C.text },
];

type Sent = { title: string; recipient: string; date: string };

const SENT: Sent[] = [
  { title: 'Ndryshimi i orarit të stërvitjes', recipient: 'Të gjithë lojtarët', date: '17/09/2026' },
  { title: 'Pagesa e kuotës mujore', recipient: 'Prindërit', date: '15/09/2026' },
  { title: 'Ndeshja e së shtunës', recipient: 'Ekipi i Parë', date: '14/09/2026' },
  { title: 'Raporti mujor është gati', recipient: 'Stafi', date: '12/09/2026' },
  { title: 'Përditësim i kartelës mjekësore', recipient: 'Të gjithë lojtarët', date: '10/09/2026' },
  { title: 'Transferim i ri i regjistruar', recipient: 'Stafi', date: '08/09/2026' },
  { title: 'Mbledhja e prindërve', recipient: 'Prindërit', date: '05/09/2026' },
  { title: 'Regjistrimi i sezonit të ri', recipient: 'Të gjithë lojtarët', date: '02/09/2026' },
];

const PAGES = [1, 2, 3, 4];

export default function NotificationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [composing, setComposing] = useState(false);

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
                  Njoftimet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Dërgo njoftime tek lojtarët, prindërit dhe stafi
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
          {/* ── Headline counts ─────────────────────────────────── */}
          {/* Only three, so they share the row instead of scrolling. */}
          <View style={styles.summaryRow}>
            {SUMMARY.map((s) => (
              <View key={s.label} style={styles.sqShadow}>
                <View style={styles.sq}>
                  {/* Frost the canvas grid, then lay a gloss sweep over it. */}
                  <BlurView
                    pointerEvents="none"
                    intensity={22}
                    tint="light"
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    colors={SQ_GLOSS}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />

                  <View style={styles.sqBody}>
                    <Text
                      style={styles.sqLabel}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {s.label}
                    </Text>
                    <Text
                      style={[styles.sqValue, { color: s.tone }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {s.value}
                    </Text>
                    {s.hint ? (
                      <Text style={[styles.sqHint, { color: s.tone }]} numberOfLines={2}>
                        {s.hint}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── New notification ──────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => setComposing(true)}
                accessibilityRole="button"
                accessibilityLabel="Njoftim i ri"
                style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
              >
                <View style={styles.plusCircle}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
                </View>
                <Text style={styles.controlText}>Njoftim i ri</Text>
              </Pressable>
            </View>

            {/* ── Latest system notice ──────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Njoftime nga sistemi
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.nRow}>
                {/* Unread marker */}
                <View style={styles.nDot} />
                <View style={styles.nBody}>
                  <Text
                    style={styles.nTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Njoftime nga sistemi
                  </Text>
                  <Text style={styles.nMeta} numberOfLines={1}>
                    <Text style={styles.nMetaBlue}>Trajneri</Text>. Admin GoalHub
                  </Text>
                </View>
                <Text style={styles.nTime} numberOfLines={1}>
                  2 javë më parë
                </Text>
              </View>
            </View>

            {/* ── Sent log ──────────────────────────────────────── */}
            <View style={[styles.card, styles.lightCard]}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Njoftime nga sistemi
                </Text>
              </View>
              <View style={styles.headLineTable} />

              {/* Columns divide the card width, so every row rule runs edge to edge. */}
              <View style={styles.tblInner}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.thLeft, styles.cTitle]}>Titulli</Text>
                  <Text style={[styles.th, styles.thLeft, styles.cRecipient]}>Marrësi</Text>
                  <Text style={[styles.th, styles.cDate]}>Data</Text>
                </View>

                {SENT.map((n) => (
                  <View key={n.title} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.tdName, styles.thLeft, styles.cTitle]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {n.title}
                    </Text>
                    <Text
                      style={[styles.tdHint, styles.thLeft, styles.cRecipient]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {n.recipient}
                    </Text>
                    <Text style={[styles.td, styles.cDate]} numberOfLines={1}>
                      {n.date}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {PAGES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {composing ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setComposing(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <NewNotificationModal onClose={() => setComposing(false)} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Njoftim i ri" popup                                                */
/* ------------------------------------------------------------------ */

/** The ring stays black throughout; only the fill turns green once picked. */
function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && styles.radioOn]} />;
}

/**
 * Two ways in, nested: "Të gjithë klubin" is the whole audience in one tap,
 * while "Filtro" opens the team and role pickers underneath it.
 */
function NewNotificationModal({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(260, height - 167);

  const [target, setTarget] = useState<Target>('all');
  const [teams, setTeams] = useState<string[]>([]);
  /** Roles stack — one team can go out to parents *and* trainers *and* players. */
  const [roles, setRoles] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  return (
    <View style={[styles.nmCard, { width: cardW }]}>
      <View style={styles.nmHeader}>
        <Text style={styles.nmTitle}>Njoftimi i ri</Text>
        <Text style={styles.nmSubtitle}>Zgjidh destinatoret dhe shkruaj mesazhin</Text>
      </View>
      <View style={styles.nmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.nmContent}
      >
        <Text style={styles.nmLabel}>Hapi 1 - Destinatarët *</Text>

        <Pressable
          onPress={() => setTarget('all')}
          accessibilityRole="radio"
          accessibilityState={{ selected: target === 'all' }}
          style={({ pressed }) => [
            styles.optBox,
            target === 'all' && styles.optBoxOn,
            pressed && styles.pressed,
          ]}
        >
          <Radio on={target === 'all'} />
          <View style={styles.optText}>
            <Text style={styles.optTitle}>Të gjithë klubin</Text>
            <Text style={styles.optSub}>Lojtarë, trajnerë, prindër</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setTarget('filter')}
          accessibilityRole="radio"
          accessibilityState={{ selected: target === 'filter' }}
          style={({ pressed }) => [
            styles.optBox,
            styles.optGap,
            target === 'filter' && styles.optBoxOn,
            pressed && styles.pressed,
          ]}
        >
          <Radio on={target === 'filter'} />
          <View style={styles.optText}>
            <Text style={styles.optTitle}>Filtro sipas ekipit dhe rolit</Text>
            <Text style={styles.optSub}>Zgjidh ekip(et) + cili rol dërgon</Text>
          </View>
        </Pressable>

        {/* Only the filtered path needs a team and a role. */}
        {target === 'filter' ? (
          <View style={styles.stepBox}>
            <Text style={styles.stepHead}>Hapi 2 - Zgjedh ekip(et)</Text>
            {FILTER_TEAMS.map((t) => (
              <Pressable
                key={t}
                onPress={() => toggle(teams, setTeams, t)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: teams.includes(t) }}
                style={({ pressed }) => [styles.teamRow, pressed && styles.pressed]}
              >
                <Radio on={teams.includes(t)} />
                <Text style={styles.teamText}>{t}</Text>
              </Pressable>
            ))}

            {/* Roles run across the row, since the teams stack down it. */}
            <Text style={[styles.stepHead, styles.stepGap]}>Hapi 3 - Zgjedh rolin</Text>
            <View style={styles.roleRow}>
              {FILTER_ROLES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => toggle(roles, setRoles, r)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: roles.includes(r) }}
                  style={({ pressed }) => [styles.roleChip, pressed && styles.pressed]}
                >
                  <Radio on={roles.includes(r)} />
                  <Text style={styles.roleText}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[styles.nmLabel, styles.nmGap]}>Titulli</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          allowFontScaling={false}
          style={styles.nmInput}
        />

        <Text style={[styles.nmLabel, styles.nmGap]}>Mesazhi</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          allowFontScaling={false}
          style={styles.nmTextarea}
          textAlignVertical="top"
        />

        <View style={styles.nmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nmBtn, styles.nmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.nmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nmBtn, styles.nmBtnSave, pressed && styles.pressed]}
          >
            <Text style={styles.nmBtnText}>Krijo</Text>
          </Pressable>
        </View>
      </ScrollView>
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
      paddingBottom: 24,
    },

    /* ── Headline counts ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 8,
      gap: 8,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      /* Three cards share the row, so each grows to a third of it. */
      flex: 1,
      height: 122,
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
      backgroundColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    sq: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#E4A000',
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 11,
    },

    /* Fixed two-line block so all three values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      marginTop: 4,
    },

    /* ── New notification ────────────────────────────────────── */
    /* Sits on the left: the row exists only so the button has gutters. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },

    controlBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      height: 34,
      paddingHorizontal: 10,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    plusCircle: {
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    controlText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.frame,
    },

    /* ── Card shell ──────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Lighter than the card body, so the title reads as its own strip. */
    head: {
      backgroundColor: C.headBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* Same rule, but for the pale row card where C.headLine disappears. */
    headLineTable: {
      height: 1,
      backgroundColor: C.tableLine,
    },

    /* The row log carries no fields, so it stays light throughout. */
    lightCard: {
      backgroundColor: C.headBg,
    },

    /* ── Latest notice ───────────────────────────────────────── */
    nRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    nDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: C.frame,
    },

    nBody: {
      flex: 1,
    },

    nTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    nMeta: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 1,
    },

    /* Only the sender's name carries the link colour. */
    nMetaBlue: {
      color: C.blue,
    },

    nTime: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    /* ── Sent log table ──────────────────────────────────────── */
    /* No horizontal padding here: the row rule is drawn on the row itself, so
       the gutter has to live inside `tr` for the line to reach the card edge. */
    tblInner: {
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      minHeight: 30,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.tableLine,
    },

    /* Columns share the card width so nothing overflows and every row rule
       lands on the same edge-to-edge span. */
    cTitle: {
      flex: 1.9,
    },

    cRecipient: {
      flex: 1.25,
    },

    cDate: {
      flex: 0.95,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    tdHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
      textAlign: 'center',
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    /* ── Overlay ─────────────────────────────────────────────── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
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

    /* ── "Njoftim i ri" popup ────────────────────────────────── */
    nmCard: {
      marginTop: 80,
      alignSelf: 'center',
      backgroundColor: MO.white,
      borderWidth: 1,
      borderColor: MO.border,
      borderRadius: 5,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    nmHeader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
      paddingTop: 12,
      paddingBottom: 10,
    },

    nmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

    nmSubtitle: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: MO.sub,
      marginTop: 2,
    },

    nmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    nmContent: {
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 15,
    },

    nmLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 5,
    },

    nmGap: {
      marginTop: 14,
    },

    /* ── Destination options ─────────────────────────────────── */
    optBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 9,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    optGap: {
      marginTop: 8,
    },

    /* The chosen destination floods blue, so which one is booked is obvious. */
    optBoxOn: {
      backgroundColor: C.blueSoft,
    },

    optText: {
      flex: 1,
    },

    optTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: MO.text,
    },

    optSub: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginTop: 1,
    },

    /* ── Steps 2 + 3 ─────────────────────────────────────────── */
    stepBox: {
      marginTop: 10,
      paddingHorizontal: 9,
      paddingTop: 9,
      paddingBottom: 10,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    stepHead: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 6,
    },

    stepGap: {
      marginTop: 12,
    },

    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 26,
    },

    teamText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    roleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },

    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    roleText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    /* Black ring at rest, filled green once picked. */
    radio: {
      width: 15,
      height: 15,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: '#000000',
      backgroundColor: 'transparent',
    },

    radioOn: {
      backgroundColor: MO.create,
    },

    /* ── Title / message fields ──────────────────────────────── */
    nmInput: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 0,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    nmTextarea: {
      height: 96,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    nmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    nmBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },

    nmBtnCancel: {
      width: 74,
      backgroundColor: MO.cancel,
    },

    nmBtnSave: {
      width: 74,
      backgroundColor: MO.create,
    },

    nmBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
