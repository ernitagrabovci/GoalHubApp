import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { createGroup, listConversations } from '@/lib/api/messages';
import type { ApiConversation, ApiContact } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Mesazhet — the trainer's own copy of the admin messages page, opened from
 * the "Chat" pill in the trainer bottom bar.
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
  white: '#F5F5F5',
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
  white: '#F5F5F5',
};

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

/** Read = blue double tick; still in flight = the same shape, greyed. */
const TICKS = {
  read: { icon: 'check-all' as const, color: C.blue },
  delivered: { icon: 'check-all' as const, color: '#B4B4B4' },
};

export default function MessagesScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!token) return Promise.resolve();
      return listConversations(token, signal)
        .then((res) => {
          if (signal?.aborted) return;
          setConversations(res.conversations);
          setContacts(res.contacts);
          setTotalUnread(res.total_unread);
        })
        .catch((e) => {
          if (signal?.aborted) return;
          if (e instanceof ApiError && e.status === 401) {
            signOut();
            router.replace('/login');
          }
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
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
                  placeholderTextColor={C.ghost}
                  value={query}
                  onChangeText={setQuery}
                />
                <MaterialCommunityIcons name="magnify" size={I(20)} color={C.gray} />
              </View>
              <Pressable
                onPress={() => setComposing(true)}
                accessibilityRole="button"
                accessibilityLabel="Bisedë e re"
                style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="plus" size={I(21)} color={C.white} />
              </Pressable>
            </View>

            {/* ── Conversations ─────────────────────────────────── */}
            {visible.length > 0 || !needle || noResults ? (
              <View style={styles.listCard}>
                {visible.length === 0 ? (
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
                    ? TICKS.read
                    : TICKS.delivered
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
                          color={C.gray}
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
    /* Coaching staff must add at least two members — the API enforces it. */
    if (picked.length < 2) {
      setError('Zgjidh të paktën dy persona.');
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
            placeholderTextColor={C.ghost}
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

    /* Time above the unread pill, both hugging the right edge. */
    rowEnd: {
      alignItems: 'flex-end',
      gap: 4,
    },

    time: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.gray,
    },

    unreadBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    unreadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.white,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.gray,
      textAlign: 'center',
      paddingHorizontal: 17,
      paddingVertical: 10,
    },

    contactSection: {
      marginTop: 16,
    },

    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.gray,
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

    /* "Mesazh" / "Grup" switch above the popup body. */
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
    },

    tab: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 8,
    },

    tabText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: MO.sub,
    },

    tabTextOn: {
      color: MO.create,
    },

    tabBar: {
      width: 34,
      height: 2,
      marginTop: 5,
      borderRadius: 1,
      backgroundColor: MO.create,
    },

    nmSearch: {
      height: 31,
      marginBottom: 9,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 16,
      paddingHorizontal: 11,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
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
      fontSize: 9.5,
      letterSpacing: 0.2,
      color: MO.white,
    },

    contactBody: {
      flex: 1,
      minWidth: 0,
    },

    contactName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: MO.text,
    },

    contactRole: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
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

    nmBtnBusy: {
      opacity: 0.6,
    },

    nmErr: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: '#C90000',
      marginTop: 10,
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
