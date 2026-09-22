import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Mesazhet — opened from the "Chat" pill in the admin bottom bar.
 *
 * A rounded search field with the magnifier and the compose button trailing
 * it, then every conversation in one framed list.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  ghost: '#A8A8A8',

  frame: '#000000',
  cardBg: '#EFF6FF',
  /* Inset rule between two chats — dark enough to read, never full width. */
  divider: 'rgba(0,0,0,0.30)',

  blue: '#2F80ED',
  blueBtn: '#86BCFD',
  green: '#159447',
  white: '#FFFFFF',
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

/** Everyone a group can be built from — long enough that the box must scroll. */
const PEOPLE = [
  'Ardit Rexha',
  'Erion Hoxha',
  'Bledar Krasniqi',
  'Migena Shahini',
  'Endrit Nushi',
  'Lira Sula',
  'Dritan Jakupi',
  'Klea Hyseni',
  'Gentian Meta',
  'Alma Prendi',
  'Fatos Berisha',
  'Sara Dema',
];

/** Read = blue double tick; still in flight = the same shape, greyed. */
const TICKS = {
  read: { icon: 'check-all' as const, color: C.blue },
  delivered: { icon: 'check-all' as const, color: '#B4B4B4' },
  sent: { icon: 'check' as const, color: '#B4B4B4' },
};

type Status = keyof typeof TICKS;

type Chat = {
  initials: string;
  name: string;
  preview: string;
  time: string;
  status: Status;
};

const CHATS: Chat[] = [
  {
    initials: 'AR',
    name: 'Ardit Rexha',
    preview: 'Stërvitja e nesërme fillon në orën 17:00.',
    time: '09:42',
    status: 'read',
  },
  {
    initials: 'EH',
    name: 'Erion Hoxha',
    preview: 'Kam dërguar kartelën mjekësore të re.',
    time: '08:15',
    status: 'read',
  },
  {
    initials: 'BK',
    name: 'Bledar Krasniqi',
    preview: 'Faleminderit për informacionin!',
    time: 'Dje',
    status: 'delivered',
  },
  {
    initials: 'MS',
    name: 'Migena Shahini',
    preview: 'A mund ta shtyjmë afatin e pagesës?',
    time: 'Dje',
    status: 'read',
  },
  {
    initials: 'EN',
    name: 'Endrit Nushi',
    preview: 'Jam gati për ndeshjen e së shtunës.',
    time: 'Dje',
    status: 'sent',
  },
  {
    initials: 'LS',
    name: 'Lira Sula',
    preview: 'Prindërit e U15 kërkojnë më shumë detaje.',
    time: 'Hën',
    status: 'delivered',
  },
  {
    initials: 'DJ',
    name: 'Dritan Jakupi',
    preview: 'Raporti mujor është dorëzuar.',
    time: 'Hën',
    status: 'read',
  },
  {
    initials: 'KH',
    name: 'Klea Hyseni',
    preview: 'Kontrata ime skadon në dhjetor.',
    time: '17/09',
    status: 'sent',
  },
  {
    initials: 'GM',
    name: 'Gentian Meta',
    preview: 'U19 humbi 2-1 në ndeshjen e djeshme.',
    time: '16/09',
    status: 'read',
  },
  {
    initials: 'AP',
    name: 'Alma Prendi',
    preview: 'Faturat e muajit janë gati.',
    time: '15/09',
    status: 'delivered',
  },
];

export default function MessagesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [creating, setCreating] = useState(false);

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
                <Text style={styles.title}>Mesazhet</Text>
                <Text style={styles.subtitle}>Bisedat me stafin dhe ekipin</Text>
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
            {/* ── Search + compose ──────────────────────────────── */}
            <View style={styles.searchRow}>
              {/* The magnifier rides inside the field, at its right end. */}
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kërko..."
                  placeholderTextColor={C.ghost}
                />
                <MaterialCommunityIcons name="magnify" size={I(20)} color={C.gray} />
              </View>
              <Pressable
                onPress={() => setCreating(true)}
                accessibilityRole="button"
                accessibilityLabel="Krijo grup"
                style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="plus" size={I(21)} color={C.white} />
              </Pressable>
            </View>

            {/* ── Conversations ─────────────────────────────────── */}
            <View style={styles.listCard}>
              {CHATS.map((chat, index) => {
                const tick = TICKS[chat.status];
                return (
                  <View key={chat.name}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/biseda',
                          params: { name: chat.name, initials: chat.initials },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Biseda me ${chat.name}`}
                      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{chat.initials}</Text>
                      </View>

                      <View style={styles.rowBody}>
                        <Text style={styles.name} numberOfLines={1}>
                          {chat.name}
                        </Text>
                        <View style={styles.previewRow}>
                          <MaterialCommunityIcons
                            name={tick.icon}
                            size={I(14)}
                            color={tick.color}
                          />
                          <Text style={styles.preview} numberOfLines={1}>
                            {chat.preview}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.time}>{chat.time}</Text>
                    </Pressable>
                  </View>
                );
              })}

              {/* The last chat is closed off too, leaving a little air below. */}
              <View style={styles.divider} />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {creating ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setCreating(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <NewGroupModal onClose={() => setCreating(false)} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Krijo grup" popup                                                  */
/* ------------------------------------------------------------------ */

/** The ring stays black throughout; only the fill turns green once picked. */
function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && styles.radioOn]} />;
}

function NewGroupModal({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  /* Capped so a long roster scrolls inside the card instead of growing it. */
  const listMax = Math.min(230, Math.max(110, height * 0.32));

  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  /* Measured so the rail beside the roster can mirror the real scroll. */
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offset, setOffset] = useState(0);

  const scrollable = contentH > viewH + 1;
  const thumbH = scrollable ? Math.max(16, (viewH / contentH) * viewH) : viewH;
  const thumbTop = scrollable
    ? (offset / Math.max(1, contentH - viewH)) * (viewH - thumbH)
    : 0;

  const toggle = (person: string) =>
    setPicked((prev) =>
      prev.includes(person) ? prev.filter((x) => x !== person) : [...prev, person],
    );

  return (
    <View style={[styles.nmCard, { width: cardW }]}>
      <View style={styles.nmHeader}>
        <Text style={styles.nmTitle}>Krijo grup</Text>
      </View>
      <View style={styles.nmDivider} />

      <View style={styles.nmContent}>
        <Text style={styles.nmLabel}>Sheno emrin e grupit</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          allowFontScaling={false}
          style={styles.nmInput}
        />

        <Text style={[styles.nmLabel, styles.nmGap]}>Zgjedh personat:</Text>
        <View style={styles.groupBox}>
          <View>
            <ScrollView
              style={{ maxHeight: listMax }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
              onContentSizeChange={(_, h) => setContentH(h)}
              onScroll={(e) => setOffset(e.nativeEvent.contentOffset.y)}
              contentContainerStyle={styles.groupInner}
            >
              {PEOPLE.map((person) => (
                <Pressable
                  key={person}
                  onPress={() => toggle(person)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: picked.includes(person) }}
                  style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                >
                  <Radio on={picked.includes(person)} />
                  <Text style={styles.personText}>{person}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Rail on the side, mirroring how far down the roster has gone. */}
            {scrollable ? (
              <View pointerEvents="none" style={styles.scrollTrack}>
                <View style={[styles.scrollThumb, { height: thumbH, top: thumbTop }]} />
              </View>
            ) : null}
          </View>
        </View>

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
      paddingBottom: 24,
    },

    /* ── Search + compose ────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },

    /* Pill-shaped and unfilled, so the canvas grid shows straight through. */
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 40,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 20,
      paddingHorizontal: 16,
    },

    searchInput: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
    },

    newBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: C.blueBtn,
      borderWidth: 1,
      borderColor: C.frame,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* ── Conversations ───────────────────────────────────────── */
    listCard: {
      marginTop: 16,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 14,
      overflow: 'hidden',
      paddingVertical: 10,
    },

    /* Kept tight so the card stays short despite the air around it. */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 17,
      paddingVertical: 9,
    },

    /* Starts level with the name and stops short of the right edge, so it
       only divides the two chats rather than spanning the card. */
    divider: {
      height: 1,
      marginLeft: 67,
      marginRight: 17,
      backgroundColor: C.divider,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      letterSpacing: 0.4,
      color: C.white,
    },

    rowBody: {
      flex: 1,
      gap: 3,
    },

    name: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 17,
      color: C.text,
    },

    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    preview: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    time: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.gray,
      alignSelf: 'flex-start',
      marginTop: 2,
    },

    /* ── "Krijo grup" popup ──────────────────────────────────── */
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

    nmCard: {
      marginTop: 118,
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

    /* ── Roster ──────────────────────────────────────────────── */
    groupBox: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    /* Keeps names clear of the rail pinned to the right edge. */
    groupInner: {
      paddingRight: 7,
    },

    scrollTrack: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: 3,
      borderRadius: 1.5,
      backgroundColor: 'rgba(0,0,0,0.06)',
    },

    scrollThumb: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: 1.5,
      backgroundColor: C.frame,
    },

    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 28,
    },

    personText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

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
