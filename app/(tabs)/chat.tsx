import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MESSAGES } from '@/lib/data';

export default function ChatScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const unread = ALL_MESSAGES.filter((m) => m.unread).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_MESSAGES;
    return ALL_MESSAGES.filter(
      (m) => m.sender.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Screen>
      <DetailHead
        icon="bubble.left.fill"
        accent="#408A71"
        title="chat"
        subtitle={unread ? `${unread} unread · tap a conversation` : 'coach & club · all read'}
      />

      {/* Quick links */}
      <View style={styles.links}>
        <Pressable style={styles.link} onPress={() => router.push('/channel')}>
          <IconSymbol name="person.2.fill" size={16} color="#2fbf71" />
          <Text style={styles.linkText}>team channel</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/notifications')}>
          <IconSymbol name="notifications" size={16} color="#f5a623" />
          <Text style={styles.linkText}>notifications</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <IconSymbol name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <IconSymbol name="xmark" size={16} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <SectionLabel>conversations</SectionLabel>
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No conversations match that search.</Text>
        ) : (
          filtered.map((m) => (
            <ListRow
              key={m.id}
              title={m.sender}
              subtitle={m.preview}
              leading={<InitialsTile initials={m.initials} color={m.color} />}
              trailing={
                <View style={styles.trailing}>
                  <Text style={styles.time}>{m.time}</Text>
                  {m.unread ? <View style={styles.unreadDot} /> : <View style={styles.readDot} />}
                </View>
              }
              onPress={() => router.push(`/conversation?id=${m.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  linkText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
    paddingVertical: Spacing.md,
  },
  list: {
    gap: Spacing.md,
  },
  trailing: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
