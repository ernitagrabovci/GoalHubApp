import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Abonimi — the sixth settings sub-page.
 *
 * Same light #FAFBFA canvas as the other sub-pages. Two stacked cards: the
 * current plan with its billing pairs, and the cancellation card whose header
 * carries the glassy red treatment.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  cardBorder: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(100,140,190,0.25)',

  ok: '#08A600',
  red: '#E03131',
  redLine: 'rgba(224,49,49,0.35)',
};

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Pair({
  left,
  right,
}: {
  left: { label: string; value: string };
  right: { label: string; value: string };
}) {
  return (
    <View style={styles.pairRow}>
      <View style={styles.pairCol}>
        <Text style={styles.pairLabel}>{left.label}</Text>
        <Text style={styles.pairValue}>{left.value}</Text>
      </View>
      <View style={[styles.pairCol, styles.pairColRight]}>
        <Text style={styles.pairLabel}>{right.label}</Text>
        <Text style={styles.pairValue}>{right.value}</Text>
      </View>
    </View>
  );
}

/** Label and value on a single line — used when the two sides are one section. */
function PairInline({
  left,
  right,
}: {
  left: { label: string; value: string };
  right: { label: string; value: string };
}) {
  return (
    <View style={styles.pairRow}>
      <View style={styles.inlineCol}>
        <Text style={styles.pairLabel}>{left.label}</Text>
        <Text style={styles.inlineValue}>{left.value}</Text>
      </View>
      <View style={[styles.inlineCol, styles.pairColRight]}>
        <Text style={styles.pairLabel}>{right.label}</Text>
        <Text style={styles.inlineValue}>{right.value}</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function SubscriptionSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

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
                <Text style={styles.title}>Abonimi</Text>
                <Text style={styles.subtitle}>Menaxho planin dhe pagesat</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.colPad}>
            {/* ── Plani aktual ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Plani aktual</Text>
              </View>

              <View style={styles.planWrap}>
                <Text style={styles.planName}>GoalHub Professional</Text>
                <Text style={styles.planSub}>Pa abonim</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Aktiv</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.pairWrap}>
                <PairInline
                  left={{ label: 'Fillimi', value: '--' }}
                  right={{ label: 'Përfundimi', value: '--' }}
                />
              </View>

              <View style={[styles.pairWrap, styles.pairWrapLast]}>
                <Pair
                  left={{ label: 'Çmimi', value: '$49/muaji' }}
                  right={{ label: 'Statusi', value: 'Aktiv' }}
                />
              </View>
            </View>

            {/* ── Anulo abonimin ───────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cancelHead}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View pointerEvents="none" style={styles.cancelTint} />

                <Text style={styles.cancelHeadText}>Anulo abonimin</Text>
              </View>

              <View style={styles.cancelBody}>
                <Text style={styles.cancelDesc}>
                  {'Kur anuloni, aksesi zgjat deri në fund të periudhës.\nPastaj llogaria kthehet në modalitetin e kufizuar.'}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.cancelBtnText}>Anulo abonimin</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
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
      paddingBottom: 8,
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

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 18,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.cardBorder,
      borderRadius: 8,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: C.text,
    },

    divider: {
      height: 1,
      backgroundColor: C.rowLine,
    },

    /* ── Current plan ────────────────────────────────────────── */
    planWrap: {
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 13,
      alignItems: 'flex-start',
    },

    planName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      letterSpacing: -0.2,
      color: C.text,
    },

    planSub: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    pill: {
      height: 22,
      marginTop: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.ok,
      borderRadius: 999,
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: '#FFFFFF',
    },

    /* ── Billing pairs ───────────────────────────────────────── */
    pairWrap: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },

    pairWrapLast: {
      paddingTop: 6,
      paddingBottom: 14,
    },

    pairRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    inlineCol: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    inlineValue: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    pairCol: {
      flex: 1,
      alignItems: 'flex-start',
    },

    pairColRight: {
      alignItems: 'flex-end',
    },

    pairLabel: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.gray,
    },

    pairValue: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
      marginTop: 2,
    },

    /* ── Cancel card ─────────────────────────────────────────── */
    cancelHead: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.redLine,
    },

    cancelTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(224,49,49,0.30)',
    },

    cancelHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: C.text,
    },

    cancelBody: {
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 15,
    },

    cancelDesc: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.text,
    },

    cancelBtn: {
      marginTop: 14,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
    },

    cancelBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.red,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
