import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { cancelSubscription } from '@/lib/api/account';
import { getClub } from '@/lib/api/club';
import { ApiError } from '@/lib/api/errors';
import type { ApiClubProfile } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

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

/** `2026-10-14T00:00:00Z` → `14/10/2026` — subscription dates are plain days. */
function dayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

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
  const { token, signOut } = useSession();

  const [sub, setSub] = useState<ApiClubProfile['subscription'] | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) =>
      getClub(token ?? '', signal).then((res) => {
        if (signal?.aborted) return;
        setSub(res.data.subscription);
      }),
    [token],
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    load(controller.signal).catch((e) => {
      if (controller.signal.aborted) return;
      if (e instanceof ApiError && e.status === 401) {
        signOut();
        router.replace('/login');
      }
    });

    return () => controller.abort();
  }, [token, router, signOut, load]);

  /* Cancelling asks first, then the plan is re-read so the card reflects it. */
  const confirmCancel = () => {
    if (!token || cancelling) return;
    Alert.alert(
      'Anulo abonimin',
      'A jeni i sigurt? Aksesi zgjat deri në fund të periudhës së paguar.',
      [
        { text: 'Jo', style: 'cancel' },
        {
          text: 'Anulo abonimin',
          style: 'destructive',
          onPress: () => {
            setCancelling(true);
            cancelSubscription(token)
              .then(() => load())
              .catch((e) => {
                if (e instanceof ApiError && e.status === 401) {
                  signOut();
                  router.replace('/login');
                  return;
                }
                Alert.alert(
                  'Veprimi dështoi',
                  e instanceof ApiError && e.status !== 0 && e.message
                    ? e.message
                    : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
                );
              })
              .finally(() => setCancelling(false));
          },
        },
      ],
    );
  };

  const active = sub?.active ?? false;
  const planName = sub?.plan ?? '—';
  const planSub = sub ? (sub.on_trial ? 'Provë falas' : active ? 'Abonim aktiv' : 'Pa abonim') : '—';
  const statusText = sub?.status ?? '—';
  const priceText = sub?.price
    ? `€${sub.price.amount} / ${sub.price.interval}`
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
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
                <Text style={styles.planName} numberOfLines={1}>
                  {planName}
                </Text>
                <Text style={styles.planSub} numberOfLines={1}>
                  {planSub}
                </Text>
                <View style={[styles.pill, !active && styles.pillOff]}>
                  <Text style={styles.pillText} numberOfLines={1}>
                    {active ? 'Aktiv' : statusText}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.pairWrap}>
                <PairInline
                  left={{ label: 'Fillimi', value: dayDate(sub?.starts_at) }}
                  right={{ label: 'Përfundimi', value: dayDate(sub?.ends_at) }}
                />
              </View>

              <View style={[styles.pairWrap, styles.pairWrapLast]}>
                <Pair
                  left={{ label: 'Çmimi', value: priceText }}
                  right={{ label: 'Statusi', value: statusText }}
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
                  onPress={confirmCancel}
                  disabled={!active || cancelling}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    (!active || cancelling) && styles.cancelBtnOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.cancelBtnText}>
                    {cancelling ? 'Duke anuluar…' : 'Anulo abonimin'}
                  </Text>
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
    },

    canvas: {
      flex: 1,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
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

    pillOff: {
      backgroundColor: C.gray,
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: '#F5F5F5',
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

    cancelBtnOff: {
      opacity: 0.4,
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
