import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { InjuryDraft, InjuryFormModal } from '@/components/medical/injury-form';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { createInjury, listInjuries } from '@/lib/api/injuries';
import { listPlayers } from '@/lib/api/players';
import type { ApiPlayer } from '@/lib/api/types';
import { toInjuryRow, type InjuryRow } from '@/lib/medical';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

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

const STATUS_TONE: Record<string, string> = {
  'I lënduar': C.red,
  'Në rehabilitim': C.orange,
  'I shëruar': C.green,
};

/* The form's Albanian labels → the API's codes. */
const API_DURING: Record<string, 'training' | 'match' | 'other'> = {
  'Stërvitje': 'training',
  'Ndeshje': 'match',
  'Tjetër': 'other',
};

const API_STATUS: Record<string, 'injured' | 'rehabilitation' | 'recovered'> = {
  'I lënduar': 'injured',
  'Në rehabilitim': 'rehabilitation',
  'I shëruar': 'recovered',
};

/** "18/08/2026" → "2026-08-18"; anything else is passed through. */
function isoDate(value: string): string {
  const [day, month, year] = value.split('/');
  if (!day || !month || !year) return value;
  return `${year}-${month}-${day}`;
}

/** Every squad member, walking the players pages. */
async function loadPlayers(token: string, signal: AbortSignal): Promise<ApiPlayer[]> {
  const out: ApiPlayer[] = [];
  let page = 1;
  for (;;) {
    const res = await listPlayers(token, { page }, signal);
    out.push(...res.data);
    if (page >= res.meta.last_page) break;
    page += 1;
  }
  return out;
}

const COLS: { key: keyof InjuryRow; label: string; width: number }[] = [
  { key: 'name', label: 'Lojtari', width: 96 },
  { key: 'type', label: 'Lloji Lëndimit', width: 88 },
  { key: 'date', label: 'Data', width: 64 },
  { key: 'returnDate', label: 'Kthimi i Pritshëm', width: 86 },
  { key: 'status', label: 'Statusi', width: 74 },
];

/* Wide enough for the row's "Shiko". */
const ACTION_W = 58;

export default function DoctorScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [injuries, setInjuries] = useState<InjuryRow[]>([]);
  const [squad, setSquad] = useState<ApiPlayer[]>([]);
  const [adding, setAdding] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const expired = () => {
      signOut();
      router.replace('/login');
    };

    Promise.allSettled([
      listInjuries(token, {}, controller.signal),
      loadPlayers(token, controller.signal),
    ]).then(([injuriesRes, playersRes]) => {
      if (controller.signal.aborted) return;

      if (injuriesRes.status === 'fulfilled') {
        setInjuries(injuriesRes.value.data.map(toInjuryRow));
      } else if (injuriesRes.reason instanceof ApiError && injuriesRes.reason.status === 401) {
        expired();
        return;
      }

      if (playersRes.status === 'fulfilled') {
        setSquad(playersRes.value);
      } else if (playersRes.reason instanceof ApiError && playersRes.reason.status === 401) {
        expired();
      }
    });

    return () => controller.abort();
  }, [token, router, signOut, reloadKey]);

  const roster = squad.flatMap((p) => (p.name ? [{ id: p.id, name: p.name }] : []));

  const add = (d: InjuryDraft) => {
    if (!token || createBusy) return;
    if (!d.playerId) {
      setCreateError('Zgjidh lojtarin nga lista e skuadrës.');
      return;
    }

    setCreateBusy(true);
    setCreateError(null);

    createInjury(token, d.playerId, {
      injury_type: d.type,
      occurred_during: API_DURING[d.during] ?? 'other',
      injury_date: isoDate(d.date),
      expected_return: isoDate(d.returnDate),
      status: API_STATUS[d.status] ?? 'injured',
      description: d.desc.trim() || null,
    })
      .then(() => {
        setCreateBusy(false);
        setAdding(false);
        setReloadKey((k) => k + 1);
      })
      .catch((e) => {
        setCreateBusy(false);
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setCreateError(
          e instanceof ApiError && e.status !== 0 && e.message
            ? e.message
            : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
        );
      });
  };

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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Mjeku
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {injuries[0]?.team ?? TEAM}
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
              onPress={() => {
                setCreateError(null);
                setAdding(true);
              }}
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
                    <View key={inj.id} style={[styles.tr, styles.trBorder]}>
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
                                id: String(inj.id),
                                name: inj.name,
                                team: inj.team,
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
          players={roster}
          busy={createBusy}
          error={createError}
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
