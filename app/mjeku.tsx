import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { InjuryDraft, InjuryFormModal } from '@/components/medical/injury-form';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Mjeku — the trainer's own view of the medical card, opened from the
 * "Mjekësia" card on the trainer home.
 *
 * Just the squad's injury log: the register button, then one row per injury
 * ending in the "Shiko" that opens it in full.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  card: '#F6FBFF',

  green: '#159447',
  green20: 'rgba(21,148,71,0.20)',
  orange: '#E4A000',
  red: '#E03131',
};

/* ── Injury log ────────────────────────────────────────────────────── */

/* The squad this page covers — shown as the page subtitle. */
const TEAM = 'Ekipi i Parë';

type Injury = {
  name: string;
  type: string;
  date: string;
  returnDate: string;
  status: string;
  /* The fields the injury's own page reads. */
  during: string;
  serviceDate: string;
  desc: string;
  treatment: string;
};

const STATUS_TONE: Record<string, string> = {
  'I lënduar': C.red,
  'Në rehabilitim': C.orange,
  'I shëruar': C.green,
};

const COLS: { key: keyof Injury; label: string; width: number }[] = [
  { key: 'name', label: 'Lojtari', width: 96 },
  { key: 'type', label: 'Lloji Lëndimit', width: 88 },
  { key: 'date', label: 'Data', width: 64 },
  { key: 'returnDate', label: 'Kthimi i Pritshëm', width: 86 },
  { key: 'status', label: 'Statusi', width: 74 },
];

/* Wide enough for the row's "Shiko". */
const ACTION_W = 58;

const INJURIES: Injury[] = [
  { name: 'Driton Demiri', type: 'Muskulor', date: '18/08/2026', returnDate: '12/09/2026', status: 'I lënduar', during: 'Ndeshje', serviceDate: '25/08/2026', desc: 'Ndjen dhimbje në kofshën e djathtë', treatment: 'Pushim dhe terapi akulli' },
  { name: 'Enver Mustafa', type: 'Kyç', date: '11/08/2026', returnDate: '05/09/2026', status: 'Në rehabilitim', during: 'Stërvitje', serviceDate: '16/08/2026', desc: 'Kyçi i majtë i ënjtur', treatment: 'Fizioterapi çdo ditë' },
  { name: 'Ardit Lapashtica', type: 'Gisht', date: '04/08/2026', returnDate: '20/09/2026', status: 'I lënduar', during: 'Stërvitje', serviceDate: '09/08/2026', desc: 'Gishti i unazës i thyer', treatment: 'Imobilizim tre javë' },
  { name: 'Narti Cerkini', type: 'Gripi', date: '27/08/2026', returnDate: '01/09/2026', status: 'I lënduar', during: 'Tjetër', serviceDate: '10/09/2026', desc: 'Gjendje gripale, pa stërvitje', treatment: 'Pushim në shtëpi' },
  { name: 'Bekim Rexhepi', type: 'Muskulor', date: '21/07/2026', returnDate: '30/07/2026', status: 'I shëruar', during: 'Stërvitje', serviceDate: '24/07/2026', desc: 'Grumbullim muskujsh në listë', treatment: 'Ngrohje dhe shtrirje' },
  { name: 'Genc Morina', type: 'Kofshë', date: '14/07/2026', returnDate: '28/07/2026', status: 'I shëruar', during: 'Ndeshje', serviceDate: '18/07/2026', desc: 'Dëmtim i kofshës së pasme', treatment: 'Terapi akulli' },
  { name: 'Hamdi Shala', type: 'Shputë', date: '02/07/2026', returnDate: '16/07/2026', status: 'I shëruar', during: 'Stërvitje', serviceDate: '06/07/2026', desc: 'Dhimbje në shputën e këmbës', treatment: 'Masazh dhe pushim' },
];

export default function DoctorScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [injuries, setInjuries] = useState<Injury[]>(INJURIES);
  const [adding, setAdding] = useState(false);

  const add = (d: InjuryDraft) => {
    setInjuries((prev) => [
      {
        name: d.player,
        type: d.type,
        date: d.date,
        returnDate: d.returnDate,
        status: d.status,
        during: d.during,
        serviceDate: d.serviceDate,
        desc: d.desc,
        treatment: d.treatment,
      },
      ...prev,
    ]);
    setAdding(false);
  };

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
                  Mjeku
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {TEAM}
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
            {/* ── Register ────────────────────────────────────────── */}
            <Pressable
              onPress={() => setAdding(true)}
              accessibilityRole="button"
              accessibilityLabel="Regjistro lëndim"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addBtnText} numberOfLines={1}>
                + Regjistro lëndim
              </Text>
            </Pressable>

            {/* ── Injury table ────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Lëndimet
                </Text>
                <Text style={styles.cardCount} numberOfLines={1}>
                  {injuries.length} lëndime
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                {/* One wrapper that takes the card's full width, so the header
                    rule and every row rule reach the far edge. */}
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {injuries.map((inj, i) => (
                    <View key={`${inj.name}-${inj.date}-${i}`} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        const isStatus = c.key === 'status';

                        return (
                          <Text
                            key={c.key}
                            style={[
                              styles.td,
                              c.key === 'name' ? styles.tdName : null,
                              isStatus
                                ? [styles.tdStrong, { color: STATUS_TONE[inj.status] ?? C.hint }]
                                : null,
                              { width: c.width },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {inj[c.key]}
                          </Text>
                        );
                      })}

                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/detajet-lendimit',
                              params: {
                                name: inj.name,
                                team: TEAM,
                                type: inj.type,
                                during: inj.during,
                                status: inj.status,
                                date: inj.date,
                                returnDate: inj.returnDate,
                                serviceDate: inj.serviceDate,
                                desc: inj.desc,
                                treatment: inj.treatment,
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko lëndimin e ${inj.name}`}
                          style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.viewBtnText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {adding ? (
        <InjuryFormModal
          title="Regjistro lëndim"
          confirmLabel="Krijo"
          onClose={() => setAdding(false)}
          onConfirm={add}
        />
      ) : null}
    </SafeAreaView>
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

    /* ── Register ────────────────────────────────────────────── */
    /* Small and hugging its label, rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      height: 34,
      marginTop: 8,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Injury table ────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    cardCount: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
    },

    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    thRow: {
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
    },

    tdStrong: {
      fontFamily: Fonts.bodySemiBold,
    },

    actions: {
      alignItems: 'flex-end',
    },

    /* Outlined, and sitting on the row itself. */
    viewBtn: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    viewBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
