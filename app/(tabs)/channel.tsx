import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { CHANNEL_POSTS, type ChannelPost } from '@/lib/data';

export default function ChannelScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<ChannelPost[]>(CHANNEL_POSTS);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setPosts((prev) => [
      ...prev,
      {
        id: `cp-${Date.now()}`,
        author: 'Rexhep Hyseni',
        initials: 'RH',
        color: '#2fbf71',
        text,
        time: 'now',
        mine: true,
      },
    ]);
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      {/* Channel header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <IconSymbol name="chevron-left" size={22} color={Colors.mint} />
        </Pressable>
        <InitialsTile initials="RH" color="#2fbf71" size={36} />
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>team channel</Text>
          <Text style={styles.headerSub}>everyone in the squad sees this</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.posts}
          showsVerticalScrollIndicator={false}>
          {posts.map((p) => (
            <View
              key={p.id}
              style={[styles.bubbleRow, p.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              {!p.mine ? <InitialsTile initials={p.initials} color={p.color} size={28} /> : null}
              <View
                style={[
                  styles.bubble,
                  p.mine ? styles.bubbleMineBox : styles.bubbleTheirsBox,
                ]}>
                <Text style={styles.bubbleText}>{p.text}</Text>
                <Text style={styles.bubbleTime}>{p.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message the squad…"
            placeholderTextColor={Colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={send} hitSlop={6}>
            <IconSymbol name="paperplane.fill" size={18} color={Colors.textOnPrimary} />
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
    paddingVertical: Spacing.sm,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerBody: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  posts: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  bubbleMine: {
    justifyContent: 'flex-end',
  },
  bubbleTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  bubbleMineBox: {
    backgroundColor: Colors.mint,
  },
  bubbleTheirsBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  bubbleText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  bubbleTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    textAlign: 'right',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopColor: Colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mint,
  },
});
