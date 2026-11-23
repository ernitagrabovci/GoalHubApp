import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { createGroup, listConversations } from '@/lib/api/messages';
import type { ApiContact, ApiConversation } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, type AppColorsOf } from '@/lib/app-theme';

/**
 * Mesazhet — opened from the "Chat" pill in the admin bottom bar.
 *
 * A rounded search field with the magnifier and the compose button trailing
 * it, then every conversation in one framed list.
 */

const C_LIGHT = {
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  ghost: '#A8A8A8',

  frame: '#DCE5DF',
  cardBg: '#EFF6FF',
  /* Inset rule between two chats — dark enough to read, never full width. */
  divider: 'rgba(0,0,0,0.30)',

  blue: '#2F80ED',
  blueBtn: '#86BCFD',
  green: '#2E7D5B',
  white: '#FFFFFF',
};

/** Popup palette — the same white card and green rim the other dialogs use. */
const MO_LIGHT = {
  border: '#B5DCC6',
  divider: '#D9EEE2',
  title: '#080808',
  text: '#17251E',
  sub: '#666666',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  cancel: '#B91C1C',
  create: '#2E7D5B',
  white: '#FFFFFF',
};

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

/** Read = blue double tick; still in flight = the same shape, greyed. */
const TICKS = (C: AppColorsOf<typeof C_LIGHT>) => ({
  read: { icon: 'check-all' as const, color: C.blueText },
  delivered: { icon: 'check-all' as const, color: '#B4B4B4' },
});

export default function MessagesScreen() {
  const C = useAppColors(C_LIGHT);
  const MO = useAppColors(MO_LIGHT);
  const styles = useMemo(() => createStyles(C, MO), [C, MO]);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!token) return Promise.resolve();
      return listConversations(token, signal)
        .then((res) => {
          if (signal?.aborted) return;
          setConversations(res.conversations);
          setContacts(res.contacts);
          setTotalUnread(res.total_unread);
          setLoadError(null);
          setLoading(false);
        })
        .catch((e) => {
          if (signal?.aborted) return;
          if (e instanceof ApiError && e.status === 401) {
            signOut();
            router.replace('/login');
            return;
          }
          setLoading(false);
          setLoadError(loadErrorMessage(e, 'Nuk mund të ngarkohen bisedat. Kontrollo lidhjen.'));
        });
    },
    [token, router, signOut]
  );

  /* Refresh on focus, then keep the list live while the page is open. */
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(controller.signal);
      const timer = setInterval(() => void load(controller.signal), 5000);
      return () => {
        controller.abort();
        clearInterval(timer);
      };
    }, [load])
  );

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? conversations.filter((c) =>
        `${c.name} ${c.role_label ?? ''} ${c.members_label ?? ''}`
          .toLowerCase()
          .includes(needle)
      )
    : conversations;

  /* People with no thread yet — searching must be able to start one. */
  const dmIds = new Set(
    conversations.filter((c) => c.type === 'dm').map((c) => c.id)
  );
  const contactMatches = needle
    ? contacts.filter(
        (c) =>
          !dmIds.has(c.id) &&
          `${c.name} ${c.role_label}`.toLowerCase().includes(needle)
      )
    : [];

  const noResults =
    needle.length > 0 && visible.length === 0 && contactMatches.length === 0;

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  const startDm = (contact: ApiContact) => {
    setComposing(false);
    router.push({
      pathname: '/biseda',
      params: {
        id: String(contact.id),
        type: 'dm',
        name: contact.name,
        initials: contact.initials,
      },
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title}>Mesazhet</Text>
                <Text style={styles.subtitle}>
                  {totalUnread > 0
                    ? `${totalUnread} mesazhe të palexuara`
                    : 'Bisedat me stafin dhe ekipin'}
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
            {/* ── Search + compose ──────────────────────────────── */}
            <View style={styles.searchRow}>
              {/* The magnifier rides inside the field, at its right end. */}
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kërko..."
                  placeholderTextColor={C.ghostText}
                  value={query}
                  onChangeText={setQuery}
                />
                <MaterialCommunityIcons name="magnify" size={I(20)} color={C.grayText} />
              </View>
              <Pressable
                onPress={() => setComposing(true)}
                accessibilityRole="button"
                accessibilityLabel="Bisedë e re"
                hitSlop={3}
                style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="plus" size={I(21)} color={C.whiteText} />
              </Pressable>
            </View>

            {/* ── Conversations ─────────────────────────────────── */}
            {visible.length > 0 || !needle || noResults ? (
              <View style={styles.listCard}>
                {loading && conversations.length === 0 ? (
                  <View style={styles.stateBox}>
                    <ActivityIndicator color={C.greenText} />
                    <Text style={styles.emptyText}>Duke ngarkuar bisedat…</Text>
                  </View>
                ) : loadError && conversations.length === 0 ? (
                  <View style={styles.stateBox}>
                    <Text style={styles.emptyText}>{loadError}</Text>
                    <Pressable
                      onPress={retry}
                      accessibilityRole="button"
                      accessibilityLabel="Provo përsëri"
                      style={({ pressed }) => [styles.stateRetry, pressed && styles.pressed]}
                    >
                      <Text style={styles.stateRetryText}>Provo përsëri</Text>
                    </Pressable>
                  </View>
                ) : visible.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {needle
                      ? 'Nuk u gjet asnjë bisedë ose kontakt.'
                      : 'Nuk ka biseda akoma.'}
                  </Text>
                ) : null}

                {visible.map((chat, index) => {
                /* The tick belongs to the last message, and only when it is yours. */
                const tick = chat.last_mine
                  ? chat.last_read
                    ? TICKS(C).read
                    : TICKS(C).delivered
                  : null;

                return (
                  <View key={`${chat.type}-${chat.id}`}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/biseda',
                          params: {
                            id: String(chat.id),
                            type: chat.type,
                            name: chat.name,
                            initials: chat.initials,
                          },
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
                          {tick ? (
                            <MaterialCommunityIcons
                              name={tick.icon}
                              size={I(14)}
                              color={tick.color}
                            />
                          ) : null}
                          <Text style={styles.preview} numberOfLines={1}>
                            {chat.last_message}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rowEnd}>
                        <Text style={styles.time}>{chat.last_time}</Text>
                        {chat.unread_count > 0 ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                              {chat.unread_count > 99 ? '99+' : chat.unread_count}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  </View>
                );
              })}

                {/* The last chat is closed off too, leaving a little air below. */}
                <View style={styles.divider} />
              </View>
            ) : null}

            {/* ── People matching the search, with no thread yet ──── */}
            {contactMatches.length ? (
              <View style={styles.contactSection}>
                <Text style={styles.sectionLabel}>Kontakte</Text>
                <View style={[styles.listCard, styles.contactCard]}>
                  {contactMatches.map((person, index) => (
                    <View key={`contact-${person.id}`}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <Pressable
                        onPress={() => startDm(person)}
                        accessibilityRole="button"
                        accessibilityLabel={`Nis bisedë me ${person.name}`}
                        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                      >
                        <View style={[styles.avatar, { backgroundColor: person.role_color }]}>
                          <Text style={styles.avatarText}>{person.initials}</Text>
                        </View>
                        <View style={styles.rowBody}>
                          <Text style={styles.name} numberOfLines={1}>
                            {person.name}
                          </Text>
                          <Text style={styles.preview} numberOfLines={1}>
                            {person.role_label}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="message-plus-outline"
                          size={I(19)}
                          color={C.grayText}
                        />
                      </Pressable>
                    </View>
                  ))}
                  <View style={styles.divider} />
                </View>
              </View>
            ) : null}
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
          <ComposeModal
            contacts={contacts}
            token={token ?? ''}
            onClose={() => setComposing(false)}
            onCreated={() => void load()}
            onStartDm={startDm}
            onExpired={() => {
              setComposing(false);
              signOut();
              router.replace('/login');
            }}
          />
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
  const C = useAppColors(C_LIGHT);
  const MO = useAppColors(MO_LIGHT);
  const styles = useMemo(() => createStyles(C, MO), [C, MO]);
  return <View style={[styles.radio, on && styles.radioOn]} />;
}

function ComposeModal({
  contacts,
  token,
  onClose,
  onCreated,
  onStartDm,
  onExpired,
}: {
  contacts: ApiContact[];
  token: string;
  onClose: () => void;
  onCreated: () => void;
  onStartDm: (contact: ApiContact) => void;
  onExpired: () => void;
}) {
  const C = useAppColors(C_LIGHT);
  const MO = useAppColors(MO_LIGHT);
  const styles = useMemo(() => createStyles(C, MO), [C, MO]);
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  /* Capped so a long roster scrolls inside the card instead of growing it. */
  const listMax = Math.min(230, Math.max(110, height * 0.32));

  const [tab, setTab] = useState<'dm' | 'group'>('dm');
  const [contactQuery, setContactQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Measured so the rail beside the roster can mirror the real scroll. */
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offset, setOffset] = useState(0);

  const scrollable = contentH > viewH + 1;
  const thumbH = scrollable ? Math.max(16, (viewH / contentH) * viewH) : viewH;
  const thumbTop = scrollable
    ? (offset / Math.max(1, contentH - viewH)) * (viewH - thumbH)
    : 0;

  const contactNeedle = contactQuery.trim().toLowerCase();
  const shownContacts = contactNeedle
    ? contacts.filter((c) =>
        `${c.name} ${c.role_label}`.toLowerCase().includes(contactNeedle)
      )
    : contacts;

  const toggle = (id: number) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (busy) return;
    if (!groupName.trim()) {
      setError('Sheno emrin e grupit.');
      return;
    }
    if (picked.length < 1) {
      setError('Zgjidh të paktën një person.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createGroup(token, { name: groupName.trim(), member_ids: picked });
      onCreated();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        onExpired();
        return;
      }
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.nmCard, { width: cardW }]}>
      <View style={styles.nmHeader}>
        <Text style={styles.nmTitle}>Bisedë e re</Text>
      </View>
      <View style={styles.nmDivider} />

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('dm')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'dm' }}
          style={styles.tab}
        >
          <Text style={[styles.tabText, tab === 'dm' && styles.tabTextOn]}>Mesazh</Text>
          {tab === 'dm' ? <View style={styles.tabBar} /> : null}
        </Pressable>
        <Pressable
          onPress={() => setTab('group')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'group' }}
          style={styles.tab}
        >
          <Text style={[styles.tabText, tab === 'group' && styles.tabTextOn]}>Grup</Text>
          {tab === 'group' ? <View style={styles.tabBar} /> : null}
        </Pressable>
      </View>

      {tab === 'dm' ? (
        <View style={styles.nmContent}>
          <TextInput
            value={contactQuery}
            onChangeText={setContactQuery}
            placeholder="Kërko kontakte..."
            placeholderTextColor={C.ghostText}
            allowFontScaling={false}
            style={styles.nmSearch}
          />

          <View style={[styles.groupBox, styles.dmBox]}>
            <ScrollView
              style={{ maxHeight: listMax }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {shownContacts.map((person) => (
                <Pressable
                  key={person.id}
                  onPress={() => onStartDm(person)}
                  accessibilityRole="button"
                  accessibilityLabel={`Bisedë me ${person.name}`}
                  style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: person.role_color }]}>
                    <Text style={styles.contactInitials}>{person.initials}</Text>
                  </View>
                  <View style={styles.contactBody}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Text style={styles.contactRole} numberOfLines={1}>
                      {person.role_label}
                    </Text>
                  </View>
                </Pressable>
              ))}

              {shownContacts.length === 0 ? (
                <Text style={styles.emptyText}>Nuk u gjet asnjë kontakt.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      ) : (
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
                {contacts.map((person) => (
                  <Pressable
                    key={person.id}
                    onPress={() => toggle(person.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: picked.includes(person.id) }}
                    style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                  >
                    <Radio on={picked.includes(person.id)} />
                    <Text style={styles.personText}>{person.name}</Text>
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

          {error ? <Text style={styles.nmErr}>{error}</Text> : null}

          <View style={styles.nmActions}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => [styles.nmBtn, styles.nmBtnCancel, pressed && styles.pressed]}
            >
              <Text style={styles.nmBtnText}>Anulo</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.nmBtn,
                styles.nmBtnSave,
                busy && styles.nmBtnBusy,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.nmBtnText}>{busy ? '...' : 'Krijo'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const createStyles = (C: AppColorsOf<typeof C_LIGHT>, MO: AppColorsOf<typeof MO_LIGHT>) => StyleSheet.create(
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
      color: C.textText,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
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
      height: 44,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 22,
      paddingHorizontal: 16,
    },

    searchInput: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 14,
      color: C.textText,
    },

    newBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.blueBtnFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* ── Conversations ───────────────────────────────────────── */
    listCard: {
      marginTop: 16,
      backgroundColor: C.cardBgFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
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
      backgroundColor: C.dividerFill,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.greenFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      letterSpacing: 0.4,
      color: C.whiteText,
    },

    rowBody: {
      flex: 1,
      gap: 3,
    },

    name: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 17,
      color: C.textText,
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
      color: C.grayText,
    },

    /* Time above the unread pill, both hugging the right edge. */
    rowEnd: {
      alignItems: 'flex-end',
      gap: 4,
    },

    time: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.grayText,
    },

    unreadBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: C.greenFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    unreadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.whiteText,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.grayText,
      textAlign: 'center',
      paddingHorizontal: 17,
      paddingVertical: 10,
    },

    stateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 96,
      paddingHorizontal: 17,
      paddingVertical: 16,
    },

    stateRetry: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 10,
    },

    stateRetryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.greenText,
    },

    contactSection: {
      marginTop: 16,
    },

    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.grayText,
      marginBottom: 6,
      marginLeft: 4,
    },

    /* Tightens the gap under the "Kontakte" label. */
    contactCard: {
      marginTop: 6,
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
      backgroundColor: MO.whiteFill,
      borderWidth: 1,
      borderColor: MO.borderBorder,
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
      color: MO.titleText,
    },

    nmDivider: {
      height: 1,
      backgroundColor: MO.dividerFill,
    },

    /* "Mesazh" / "Grup" switch above the popup body. */
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
    },

    tab: {
      flex: 1,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingTop: 8,
    },

    tabText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: MO.subText,
    },

    tabTextOn: {
      color: MO.createText,
    },

    tabBar: {
      width: 34,
      height: 2,
      marginTop: 5,
      borderRadius: 1,
      backgroundColor: MO.createFill,
    },

    nmSearch: {
      height: 44,
      marginBottom: 9,
      backgroundColor: MO.inputBgFill,
      borderWidth: 1,
      borderColor: MO.inputBorderBorder,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 14,
      color: MO.textText,
    },

    /* Keep the rounded avatar and two text lines roomy inside the roster. */
    dmBox: {
      paddingVertical: 4,
    },

    contactAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    contactInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      letterSpacing: 0.2,
      color: MO.whiteText,
    },

    contactBody: {
      flex: 1,
      minWidth: 0,
    },

    contactName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: MO.textText,
    },

    contactRole: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: MO.subText,
    },

    nmContent: {
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 15,
    },

    nmLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: MO.subText,
      marginBottom: 5,
    },

    nmGap: {
      marginTop: 14,
    },

    nmInput: {
      height: 44,
      backgroundColor: MO.inputBgFill,
      borderWidth: 1,
      borderColor: MO.inputBorderBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 0,
      fontSize: 14,
      fontFamily: Fonts.body,
      color: MO.textText,
    },

    /* ── Roster ──────────────────────────────────────────────── */
    groupBox: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: C.frameBorder,
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
      backgroundColor: C.frameFill,
    },

    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      minHeight: 44,
    },

    personText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: MO.textText,
    },

    radio: {
      width: 15,
      height: 15,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: C.frameBorder,
      backgroundColor: 'transparent',
    },

    radioOn: {
      backgroundColor: MO.createFill,
    },

    nmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    nmBtn: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },

    nmBtnCancel: {
      width: 88,
      backgroundColor: MO.cancelFill,
    },

    nmBtnSave: {
      width: 88,
      backgroundColor: MO.createFill,
    },

    nmBtnBusy: {
      opacity: 0.6,
    },

    nmErr: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: '#B91C1C',
      marginTop: 10,
    },

    nmBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 13,
      lineHeight: 18,
      color: MO.whiteText,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
