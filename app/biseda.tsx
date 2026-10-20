import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import {
  deleteMessage,
  getGroupThread,
  getThread,
  reactToMessage,
  sendGroupMessage,
  sendMessage,
  updateMessage,
} from '@/lib/api/messages';
import type { ApiMessage } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * A single conversation — opened by tapping a row on the Mesazhet page.
 *
 * The thread sits in the same framed blue pane the list uses, one white
 * bubble per message with the time and delivery ticks just outside it.
 * Tapping a bubble lifts it and unfolds the reaction / action bar beneath,
 * the way WhatsApp does — no modal.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  ghost: '#A8A8A8',

  frame: '#000000',
  cardBg: '#EFF6FF',

  blue: '#2F80ED',
  green: '#159447',
  red: '#E03131',
  white: '#F5F5F5',
};

/** Read = blue double tick; still in flight = the same shape, greyed. */
const TICKS = {
  read: { icon: 'check-all' as const, color: C.blue },
  delivered: { icon: 'check-all' as const, color: '#B4B4B4' },
};

type Status = keyof typeof TICKS;

type Msg = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
  status?: Status;
  /** The leading reaction tally; the API groups them by emoji. */
  reaction?: string;
  reactionCount?: number;
  deleted?: boolean;
};

/** The API's message shape, read into the bubble the thread renders. */
function toMsg(m: ApiMessage): Msg {
  return {
    id: String(m.id),
    text: m.body,
    time: m.time,
    mine: m.mine,
    status: m.mine ? (m.read ? 'read' : 'delivered') : undefined,
    reaction: m.reactions[0]?.reaction,
    reactionCount: m.reactions[0]?.count,
    deleted: m.deleted,
  };
}

const EMOJI = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const DELETED_TEXT = 'Ky mesazh është fshirë';

/**
 * The frost drawn over every part of the page but the focused message.
 * Sits below it in the stack, so the tapped bubble stays crisp on top.
 */
function Veil() {
  return (
    <BlurView pointerEvents="none" intensity={14} tint="light" style={styles.veil} />
  );
}

export default function ConversationScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const { id, type, name, initials } = useLocalSearchParams<{
    id?: string;
    type?: string;
    name?: string;
    initials?: string;
  }>();

  const peerId = id ? Number(id) : null;
  const isGroup = type === 'group';

  const [msgs, setMsgs] = useState<Msg[]>([]);
  /* The bubble whose action bar is unfolded — also the target of its actions. */
  const [selected, setSelected] = useState<string | null>(null);
  const [composer, setComposer] = useState('');
  /* Inline edit replaces the bubble text until saved or cancelled. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!token || !peerId || Number.isNaN(peerId)) return;
    const controller = new AbortController();

    const load = isGroup
      ? getGroupThread(token, peerId, controller.signal).then((res) => res.messages)
      : getThread(token, peerId, controller.signal).then((res) => res.messages);

    load
      .then((messages) => {
        if (controller.signal.aborted) return;
        setMsgs(messages.map(toMsg));
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, peerId, isGroup, router, signOut]);

  const send = () => {
    const body = composer.trim();
    if (!body || !token || !peerId) return;
    setComposer('');

    const post = isGroup
      ? sendGroupMessage(token, peerId, body)
      : sendMessage(token, peerId, body);

    post
      .then((res) => setMsgs((prev) => [...prev, toMsg(res.message)]))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
  };

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      signOut();
      router.replace('/login');
      return;
    }
    Alert.alert(
      'Veprimi dështoi',
      e instanceof ApiError && e.status !== 0
        ? e.message
        : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
    );
  };

  /* The API groups reactions by emoji, so the bubble shows the leading tally. */
  const applyReactions = (id: string, reactions: ApiMessage['reactions']) =>
    setMsgs((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              reaction: reactions[0]?.reaction,
              reactionCount: reactions[0]?.count,
            }
          : m
      )
    );

  const pickReaction = (msg: Msg, emoji: string) => {
    if (!token) return;
    setSelected(null);

    reactToMessage(token, Number(msg.id), emoji)
      .then((res) => applyReactions(String(res.id), res.reactions))
      .catch(fail);
  };

  const removeMsg = (msg: Msg) => {
    if (!token) return;

    Alert.alert('Fshij mesazhin', 'Ky mesazh do të fshihet për të gjithë.', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshij',
        style: 'destructive',
        onPress: () => {
          setSelected(null);
          deleteMessage(token, Number(msg.id))
            .then(() =>
              setMsgs((prev) =>
                prev.map((m) =>
                  m.id === msg.id
                    ? {
                        ...m,
                        text: '',
                        deleted: true,
                        reaction: undefined,
                        reactionCount: undefined,
                      }
                    : m
                )
              )
            )
            .catch(fail);
        },
      },
    ]);
  };

  const startEdit = (msg: Msg) => {
    setSelected(null);
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = () => {
    const body = editText.trim();
    if (!token || !editingId) return;
    if (!body) {
      Alert.alert('Mesazhi është bosh', 'Shkruaj tekstin e mesazhit para se ta ruash.');
      return;
    }

    updateMessage(token, Number(editingId), body)
      .then((res) => {
        const updated = res.message;
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === String(updated.id)
              ? {
                  ...m,
                  text: updated.body,
                  reaction: updated.reactions[0]?.reaction,
                  reactionCount: updated.reactions[0]?.count,
                }
              : m
          )
        );
        cancelEdit();
      })
      .catch(fail);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Pinned header — back arrow, then who you are talking to */}
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

              <View style={styles.peer}>
                <View style={styles.peerAvatar}>
                  <Text style={styles.peerInitials}>{initials ?? '—'}</Text>
                </View>
                <Text style={styles.peerName} numberOfLines={1}>
                  {name ?? '—'}
                </Text>
              </View>
            </View>
          </View>

          {selected ? <Veil /> : null}
        </View>

        <View style={[styles.colPad, styles.fill]}>
          {/* ── Thread ────────────────────────────────────────── */}
          <Pressable style={styles.thread} onPress={() => setSelected(null)}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.threadInner}
            >
              {msgs.map((msg) => {
                const tick = msg.status ? TICKS[msg.status] : null;
                const isSelected = selected === msg.id;

                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msg,
                      msg.mine ? styles.msgMine : styles.msgTheirs,
                      isSelected && styles.msgLifted,
                    ]}
                  >
                    <Pressable
                      onPress={() => setSelected(isSelected ? null : msg.id)}
                      disabled={!!msg.deleted || editingId === msg.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Mesazhi: ${msg.text}`}
                      style={[
                        styles.bubble,
                        msg.mine ? styles.bubbleMine : styles.bubbleTheirs,
                        isSelected && styles.bubbleActive,
                      ]}
                    >
                      {editingId === msg.id ? (
                        <>
                          <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            autoFocus
                            multiline
                          />
                          <View style={styles.editActions}>
                            <Pressable
                              onPress={cancelEdit}
                              accessibilityRole="button"
                              accessibilityLabel="Anulo ndryshimin"
                              hitSlop={6}
                            >
                              <Text style={styles.barBtnText}>Anulo</Text>
                            </Pressable>
                            <Pressable
                              onPress={saveEdit}
                              accessibilityRole="button"
                              accessibilityLabel="Ruaj ndryshimin"
                              hitSlop={6}
                            >
                              <Text style={[styles.barBtnText, styles.barBtnSave]}>Ruaj</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <Text style={msg.deleted ? styles.deletedText : styles.msgText}>
                          {msg.deleted ? DELETED_TEXT : msg.text}
                        </Text>
                      )}

                      {msg.reaction ? (
                        <View
                          style={[
                            styles.reaction,
                            msg.mine ? styles.reactionMine : styles.reactionTheirs,
                          ]}
                        >
                          <Text style={styles.reactionEmoji}>
                            {msg.reaction}
                            {msg.reactionCount && msg.reactionCount > 1
                              ? ` ${msg.reactionCount}`
                              : ''}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>

                    {/* Unfolds under the tapped bubble, on its own side. */}
                    {isSelected ? (
                      <View style={styles.picker}>
                        <View style={styles.pickerRow}>
                          {EMOJI.map((emoji) => (
                            <Pressable
                              key={emoji}
                              onPress={() => pickReaction(msg, emoji)}
                              accessibilityRole="button"
                              accessibilityLabel={`Reagim ${emoji}`}
                              style={({ pressed }) => [styles.emojiBtn, pressed && styles.pressed]}
                            >
                              <Text style={styles.emoji}>{emoji}</Text>
                            </Pressable>
                          ))}
                        </View>

                        {msg.mine ? (
                          <View style={styles.pickerActions}>
                            <Pressable
                              onPress={() => startEdit(msg)}
                              accessibilityRole="button"
                              accessibilityLabel="Ndrysho mesazhin"
                              style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                            >
                              <Text style={styles.barBtnText}>Ndrysho</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => removeMsg(msg)}
                              accessibilityRole="button"
                              accessibilityLabel="Fshij mesazhin"
                              style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                            >
                              <Text style={[styles.barBtnText, styles.barBtnDanger]}>Fshij</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Time and delivery state sit outside the bubble. */}
                    <View style={[styles.meta, msg.reaction ? styles.metaReacted : null]}>
                      <Text style={styles.metaTime}>{msg.time}</Text>
                      {tick ? (
                        <MaterialCommunityIcons name={tick.icon} size={I(13)} color={tick.color} />
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* Frosts the whole thread; the focused bubble rides above it. */}
              {selected ? <Veil /> : null}
            </ScrollView>
          </Pressable>

          {/* ── Composer ──────────────────────────────────────── */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Sheno mesazhin ..."
              placeholderTextColor={C.ghost}
              value={composer}
              onChangeText={setComposer}
            />
            <Pressable
              onPress={send}
              accessibilityRole="button"
              accessibilityLabel="Dërgo mesazhin"
              style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="arrow-right" size={I(21)} color={C.white} />
            </Pressable>

            {selected ? <Veil /> : null}
          </View>
        </View>
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

    /* Lets the thread grow into whatever the header and composer leave. */
    fill: {
      flex: 1,
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
      paddingRight: 6,
    },

    /* Avatar then name, side by side, trailing the back arrow. */
    peer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    peerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    peerInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      letterSpacing: 0.4,
      color: C.white,
    },

    peerName: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    /* ── Thread ──────────────────────────────────────────────── */
    /* The bottom margin shortens the pane without nudging the composer. */
    thread: {
      flex: 1,
      marginBottom: 4,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 14,
      overflow: 'hidden',
    },

    /* Messages start at the top of the pane, WhatsApp-style. */
    threadInner: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 9,
      gap: 7,
    },

    /* Frosts the pane while one message is focused. */
    veil: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
      backgroundColor: 'rgba(245,245,245,0.30)',
    },

    /* Above the veil, so the tapped bubble stays sharp. */
    msgLifted: {
      zIndex: 3,
    },

    /* Bubble over its meta line, both hugging the sender's side. */
    msg: {
      maxWidth: '80%',
      gap: 2,
    },

    msgMine: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },

    msgTheirs: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },

    /* White bubble, hairline rim, and one squared-off bottom corner on the
       sender's side so the tail reads as coming from them. */
    bubble: {
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 14,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    bubbleMine: {
      borderBottomRightRadius: 0,
    },

    bubbleTheirs: {
      borderBottomLeftRadius: 0,
    },

    /* The tapped bubble swells and lifts away from the rest of the thread. */
    bubbleActive: {
      transform: [{ scale: 1.05 }],
      zIndex: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 4,
    },

    msgText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: C.text,
    },

    deletedText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: C.gray,
    },

    editInput: {
      minWidth: 150,
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: C.text,
      padding: 0,
    },

    editActions: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 2,
    },

    /* Hangs off the bubble's bottom corner, the way chat reactions do. */
    reaction: {
      position: 'absolute',
      bottom: -10,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },

    reactionMine: {
      right: -6,
    },

    reactionTheirs: {
      left: -6,
    },

    reactionEmoji: {
      fontSize: 11,
      lineHeight: 15,
    },

    /* ── Unfolded action bar ─────────────────────────────────── */
    picker: {
      marginTop: 9,
      gap: 6,
    },

    pickerRow: {
      flexDirection: 'row',
      gap: 3,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 20,
      paddingHorizontal: 5,
      paddingVertical: 4,
    },

    emojiBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emoji: {
      fontSize: 16,
      lineHeight: 20,
    },

    pickerActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignSelf: 'stretch',
      gap: 6,
    },

    barBtn: {
      height: 26,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    barBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: C.text,
    },

    barBtnDanger: {
      color: C.red,
    },

    barBtnSave: {
      color: C.green,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 3,
    },

    /* Clears the reaction chip overhanging the bubble. */
    metaReacted: {
      marginTop: 9,
    },

    metaTime: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    /* ── Composer ────────────────────────────────────────────── */
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
      paddingBottom: 64,
    },

    /* Unfilled, so the canvas grid runs straight through the field. */
    input: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 8,
      paddingHorizontal: 14,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
    },

    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
