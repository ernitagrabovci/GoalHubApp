import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

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
  white: '#FFFFFF',
};

/** Read = blue double tick; still in flight = the same shape, greyed. */
const TICKS = {
  read: { icon: 'check-all' as const, color: C.blue },
  delivered: { icon: 'check-all' as const, color: '#B4B4B4' },
  sent: { icon: 'check' as const, color: '#B4B4B4' },
};

type Status = keyof typeof TICKS;

type Msg = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
  status?: Status;
  reaction?: string;
  deleted?: boolean;
};

const THREAD: Msg[] = [
  { id: '1', text: 'Përshëndetje! A e kemi stërvitjen nesër në orën 17:00?', time: '09:31', mine: false },
  { id: '2', text: 'Po, si gjithmonë. Në fushën kryesore.', time: '09:33', mine: true, status: 'read' },
  { id: '3', text: 'Faleminderit. A duhet të marrim pajisjet e reja?', time: '09:35', mine: false },
  { id: '4', text: 'Po, këpucat dhe fanellat e stërvitjes.', time: '09:36', mine: true, status: 'read' },
  { id: '5', text: "Në rregull, do t'i marr me vete.", time: '09:38', mine: false },
  { id: '6', text: 'Perfekt. Shihemi nesër!', time: '09:40', mine: true, status: 'delivered' },
];

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
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const { name, initials } = useLocalSearchParams<{ name?: string; initials?: string }>();

  const [msgs, setMsgs] = useState<Msg[]>(THREAD);
  /* The bubble whose action bar is unfolded — also the target of its actions. */
  const [selected, setSelected] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const pickReaction = (emoji: string) => {
    setMsgs((prev) =>
      prev.map((m) =>
        m.id === selected ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m,
      ),
    );
    setSelected(null);
  };

  const startEdit = () => {
    const msg = msgs.find((m) => m.id === selected);
    if (!msg) return;
    setDraft(msg.text);
    setEditingId(msg.id);
    setSelected(null);
  };

  const saveEdit = () => {
    setMsgs((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, text: draft.trim() || m.text } : m)),
    );
    setEditingId(null);
  };

  /* Deletion leaves a tombstone in the same slot rather than closing the gap. */
  const removeMsg = () => {
    setMsgs((prev) =>
      prev.map((m) => (m.id === selected ? { ...m, deleted: true, reaction: undefined } : m)),
    );
    setSelected(null);
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
                  <Text style={styles.peerInitials}>{initials ?? 'AR'}</Text>
                </View>
                <Text style={styles.peerName} numberOfLines={1}>
                  {name ?? 'Ardit Rexha'}
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
                const isEditing = editingId === msg.id;
                const isSelected = selected === msg.id && !isEditing;

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
                      disabled={isEditing || !!msg.deleted}
                      accessibilityRole="button"
                      accessibilityLabel={`Mesazhi: ${msg.text}`}
                      style={[
                        styles.bubble,
                        msg.mine ? styles.bubbleMine : styles.bubbleTheirs,
                        isSelected && styles.bubbleActive,
                      ]}
                    >
                      {isEditing ? (
                        <TextInput
                          style={styles.editInput}
                          value={draft}
                          onChangeText={setDraft}
                          multiline
                          autoFocus
                        />
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
                          <Text style={styles.reactionEmoji}>{msg.reaction}</Text>
                        </View>
                      ) : null}
                    </Pressable>

                    {isEditing ? (
                      <View style={styles.editActions}>
                        <Pressable
                          onPress={() => setEditingId(null)}
                          accessibilityRole="button"
                          accessibilityLabel="Anulo"
                          style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.barBtnText}>Anulo</Text>
                        </Pressable>
                        <Pressable
                          onPress={saveEdit}
                          accessibilityRole="button"
                          accessibilityLabel="Ruaj"
                          style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.barBtnText}>Ruaj</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {/* Unfolds under the tapped bubble, on its own side. */}
                    {isSelected ? (
                      <View style={styles.picker}>
                        <View style={styles.pickerRow}>
                          {EMOJI.map((emoji) => (
                            <Pressable
                              key={emoji}
                              onPress={() => pickReaction(emoji)}
                              accessibilityRole="button"
                              accessibilityLabel={`Reagim ${emoji}`}
                              style={({ pressed }) => [styles.emojiBtn, pressed && styles.pressed]}
                            >
                              <Text style={styles.emoji}>{emoji}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <View style={styles.pickerActions}>
                          {/* Only your own messages can be rewritten. */}
                          {msg.mine ? (
                            <Pressable
                              onPress={startEdit}
                              accessibilityRole="button"
                              accessibilityLabel="Edito mesazhin"
                              style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                            >
                              <Text style={styles.barBtnText}>Edito</Text>
                            </Pressable>
                          ) : null}
                          <Pressable
                            onPress={removeMsg}
                            accessibilityRole="button"
                            accessibilityLabel="Fshij mesazhin"
                            style={({ pressed }) => [styles.barBtn, pressed && styles.pressed]}
                          >
                            <Text style={[styles.barBtnText, styles.barBtnDanger]}>Fshij</Text>
                          </Pressable>
                        </View>
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
            />
            <Pressable
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

    /* Lets the thread grow into whatever the header and composer leave. */
    fill: {
      flex: 1,
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
      backgroundColor: 'rgba(255,255,255,0.30)',
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
