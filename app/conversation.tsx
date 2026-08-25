import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InitialsTile } from '@/components/list-row';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MESSAGES, CONVERSATIONS, type ChatBubble } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

export default function ConversationScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const message =
    ALL_MESSAGES.find((m) => m.id === id) ?? ALL_MESSAGES[0];

  const [bubbles, setBubbles] = useState<ChatBubble[]>(
    CONVERSATIONS[message.id] ?? CONVERSATIONS.m1
  );
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setBubbles((prev) => [
      ...prev,
      {
        id: `me-${Date.now()}`,
        text,
        time: new Date().toTimeString().slice(0, 5),
        mine: true,
      },
    ]);
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <IconSymbol name="chevron-left" size={22} color={Colors.mint} />
        </Pressable>
        <InitialsTile initials={message.initials} color={message.color} size={40} />
        <View style={styles.headerBody}>
          <Text style={styles.headerName}>{message.sender}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>{t('conversation.onlineNow')}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}>
          {bubbles.map((b) => (
            <View
              key={b.id}
              style={[styles.bubbleRow, b.mine ? styles.rowMine : styles.rowTheirs]}>
              <View style={[styles.bubble, b.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={b.mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
                  {b.text}
                </Text>
                <Text style={styles.bubbleTime}>{b.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t('conversation.messagePlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            style={[styles.send, !draft.trim() && styles.sendDisabled]}>
            <IconSymbol name="paperplane.fill" size={20} color={Colors.textOnPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  statusText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  thread: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  bubbleMine: {
    backgroundColor: Colors.mint,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleTextMine: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.textOnPrimary,
  },
  bubbleTextTheirs: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
  },
  bubbleTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 3,
    marginLeft: Spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
