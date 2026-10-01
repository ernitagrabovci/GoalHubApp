import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { InjuryDraft, InjuryFormModal } from '@/components/medical/injury-form';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * One injury — opened from "Shiko" on the medical card's injury log. The row
 * comes in as route params, so the page always mirrors the log entry it was
 * opened from.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
};

const LABELS = [
  'Lojtari',
  'Ekipi',
  'Lloji i lëndimit',
  'Ndodhi gjatë',
  'Data e lëndimit',
  'Kthimi i pritshëm',
  'Data e shërbimit',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "27/08/2026" → "27 Aug 2026"; anything unparseable is left alone. */
function formatDate(value: string): string {
  const [day, mm, year] = value.split('/');
  const month = MONTHS[Number(mm) - 1];
  if (!day || !month || !year) return value;
  return `${day} ${month} ${year}`;
}

export default function InjuryDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    name?: string;
    team?: string;
    type?: string;
    during?: string;
    status?: string;
    date?: string;
    returnDate?: string;
    serviceDate?: string;
    desc?: string;
    treatment?: string;
  }>();

  /* The log row opens the page; the edit popup moves it on from there. */
  const [injury, setInjury] = useState<InjuryDraft>(() => ({
    player: params.name ?? '',
    type: params.type ?? '',
    during: params.during ?? '',
    status: params.status ?? '',
    date: params.date ?? '',
    returnDate: params.returnDate ?? '',
    serviceDate: params.serviceDate ?? '',
    desc: params.desc ?? '',
    treatment: params.treatment ?? '',
  }));

  const [editing, setEditing] = useState(false);

  const title = injury.type ? `${injury.player} - ${injury.type}` : injury.player;

  const values = [
    injury.player,
    params.team ?? '',
    injury.type,
    injury.during,
    formatDate(injury.date),
    formatDate(injury.returnDate),
    formatDate(injury.serviceDate),
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
                  {title}
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
            {/* ── Edit the record ─────────────────────────────────── */}
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Edito lëndimin"
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="pencil" size={I(14)} color={C.text} />
              <Text style={styles.editBtnText} numberOfLines={1}>
                Edito
              </Text>
            </Pressable>

            <View style={styles.card}>
              {/* ── Table head: two titles, split by the card's rule ─ */}
              <View style={styles.headRow}>
                <Text style={styles.headTextBlack}>Detajet e lëndimit</Text>
                <Text style={styles.headTextGreen}>E ardhme</Text>
              </View>
              <View style={styles.headLine} />

              {/* ── Label / value rows ────────────────────────────── */}
              {LABELS.map((label, i) => (
                <View key={label} style={styles.cellRow}>
                  <Text style={styles.cellLabel} numberOfLines={1}>
                    {label}
                  </Text>
                  <Text
                    style={[styles.cellValue, i === 0 && styles.cellValueName]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {values[i]}
                  </Text>
                </View>
              ))}

              {/* ── Free text, left-aligned ───────────────────────── */}
              <View style={styles.foot}>
                <Text style={styles.footLabel}>Përshkrimi</Text>
                <Text style={styles.footValue}>{injury.desc}</Text>

                <Text style={[styles.footLabel, styles.footGap]}>Trajtimi</Text>
                <Text style={styles.footValue}>{injury.treatment}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {editing ? (
        <InjuryFormModal
          title="Edito lëndimin"
          confirmLabel="Ruaj"
          initial={injury}
          onClose={() => setEditing(false)}
          onConfirm={(d) => {
            setInjury(d);
            setEditing(false);
          }}
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Edit the record ─────────────────────────────────────── */
    editBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      marginTop: 8,
      paddingHorizontal: 12,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 12,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    headTextBlack: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headTextGreen: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.green,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Rows ────────────────────────────────────────────────── */
    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 26,
      paddingHorizontal: 12,
    },

    /* The labels run longer than the values, so they take the bigger share. */
    cellLabel: {
      flex: 1.25,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.hint,
    },

    cellValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    /* The player's name carries the row — it reads a size up from the rest. */
    cellValueName: {
      fontSize: 15,
      lineHeight: 19,
    },

    /* ── Free text ───────────────────────────────────────────── */
    foot: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 14,
    },

    footLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    footValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 2,
    },

    footGap: {
      marginTop: 14,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
