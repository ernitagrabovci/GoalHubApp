import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * One clip, opened from the play mark on a Video Strategjia card. The
 * description up top, then the clip's facts beside the level it is filed
 * under — that level restated on its own, big, in its own colour.
 *
 * The clip's facts ride in on the route params; the library has no per-item
 * endpoint, so the list hands everything this page needs.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* blue1 = the deeper card body; blue2 = the pale title strip. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  green: '#159447',
};

/* The library's `level`, mapped onto its label. */
const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Fillestar',
  intermediate: 'Mesëm',
  advanced: 'Avancuar',
};

/* The library's `file_type`, under the Lloji label. */
const TYPE_LABEL: Record<string, string> = { mp4: 'Video', gif: 'Video', pdf: 'PDF' };

/**
 * Each level owns a colour: the rim at full strength, the wash at 20%. The
 * level card reads its tone from here, keyed by the stored level code.
 */
const LEVEL_TONES: Record<string, { rim: string; wash: string }> = {
  beginner: { rim: '#159447', wash: 'rgba(21,148,71,0.20)' },
  intermediate: { rim: '#2F80ED', wash: 'rgba(47,128,237,0.20)' },
  advanced: { rim: '#B09AF9', wash: 'rgba(176,154,249,0.20)' },
};

const FALLBACK_TONE = { rim: '#2F80ED', wash: 'rgba(47,128,237,0.20)' };

const pad2 = (n: number) => String(n).padStart(2, '0');

/** An ISO timestamp as "12/08/2026"; null or unparseable renders as a dash. */
function dmy(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function VideoDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    level?: string;
    category?: string;
    type?: string;
    trainer?: string;
    shared?: string;
    description?: string;
    date?: string;
  }>();

  const title = params.title ?? '—';
  const level = params.level ?? '';
  const levelLabel = level ? LEVEL_LABEL[level] ?? level : '—';
  const category = params.category || '—';
  const type = params.type ? TYPE_LABEL[params.type] ?? params.type.toUpperCase() : '—';
  const trainer = params.trainer || '—';
  const shared = params.shared === '1';
  const description = params.description || '—';
  const date = dmy(params.date ?? null);

  const tone = LEVEL_TONES[level] ?? FALLBACK_TONE;

  /** The clip's facts, in the order they are stacked in the Detajet card. */
  const details: { label: string; value: string; green?: boolean }[] = [
    { label: 'Niveli', value: levelLabel },
    { label: 'Kategoria', value: category },
    { label: 'Lloji', value: type },
    { label: 'Trajneri', value: trainer },
    { label: 'Shpërndarë', value: shared ? 'PO' : 'JO', green: shared },
  ];

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
                <View style={styles.titleRow}>
                  <MaterialCommunityIcons name="play" size={I(20)} color={C.text} />
                  <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {title}
                  </Text>
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${levelLabel} • ${category} • ${date}`}
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
            {/* ── Përshkrimi ────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Përshkrimi
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <Text style={styles.desc}>{description}</Text>
              </View>
            </View>

            {/* ── Detajet beside the level ──────────────────────── */}
            <View style={styles.twoRow}>
              <View style={[styles.card, styles.detailCard]}>
                <View style={[styles.head, styles.detailHead]}>
                  <Text style={styles.headText} numberOfLines={1}>
                    Detajet
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={[styles.body, styles.detailBody]}>
                  {details.map((d) => (
                    <DetailRow key={d.label} label={d.label} value={d.value} green={d.green} />
                  ))}
                </View>
              </View>

              {/* The level, restated on its own in its own colour. */}
              <View
                style={[
                  styles.levelCard,
                  { backgroundColor: tone.wash, borderColor: tone.rim },
                ]}
              >
                <Text style={styles.levelValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {levelLabel}
                </Text>
                <Text style={styles.levelLabel}>Niveli i materialit</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* One line of the Detajet card                                        */
/* ------------------------------------------------------------------ */

function DetailRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.dValue, green && styles.dValueGreen]} numberOfLines={1}>
        {value}
      </Text>
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

    /* The play mark rides ahead of the title, the way the card shows it. */
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    title: {
      flexShrink: 1,
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

    /* ── Cards ───────────────────────────────────────────────── */
    /* A hairline rim — the black should read as an edge, not a frame. */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'visible',
    },

    head: {
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.blue2,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    body: {
      backgroundColor: C.blue1,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },

    desc: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 18,
      color: C.text,
    },

    /* ── Detajet beside the level ────────────────────────────── */
    twoRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },

    detailCard: {
      flex: 1.6,
    },

    /* Cut shorter than the Përshkrimi card above it, so the pair sits low. */
    detailHead: {
      paddingVertical: 8,
    },

    detailBody: {
      paddingTop: 8,
      paddingBottom: 8,
    },

    dRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      minHeight: 19,
    },

    dLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.gray,
    },

    dValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* Only the shared-with-the-team flag is coloured. */
    dValueGreen: {
      color: C.green,
    },

    /* Rim and wash both come from the level's tone, applied inline. */
    levelCard: {
      flex: 1,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderWidth: 2,
      borderRadius: 7,
    },

    levelValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: C.text,
    },

    levelLabel: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 6,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
