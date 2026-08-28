import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { messagesForRole } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

export default function ChatScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useSession();
  const { t } = useLanguage();
  const viewer = user?.role === 'player' || user?.role === 'parent';
  const messages = messagesForRole(user?.role ?? 'administrator');
  const [query, setQuery] = useState('');
  const unread = messages.filter((m) => m.unread).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) => m.sender.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q),
    );
  }, [query, messages]);

  return (
    <Screen>
      <DetailHead
        icon="bubble.left.fill"
        accent="#408A71"
        title={t('chat.title')}
        subtitle={
          viewer
            ? t('chat.unreadTrainer', { unread })
            : unread
              ? t('chat.unreadTap', { unread })
              : t('chat.allRead')
        }
      />

      {/* Quick links */}
      <View style={styles.links}>
        {user?.role === 'parent' ? null : (
          <Pressable style={styles.link} onPress={() => router.push('/channel')}>
            <IconSymbol name="person.2.fill" size={16} color="#2fbf71" />
            <Text style={styles.linkText}>{t('chat.teamChannel')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.link} onPress={() => router.push('/notifications')}>
          <IconSymbol name="notifications" size={16} color="#f5a623" />
          <Text style={styles.linkText}>{t('chat.notifications')}</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <IconSymbol name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('chat.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <IconSymbol name="xmark" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <SectionLabel>{t('chat.conversations')}</SectionLabel>
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>{t('chat.empty')}</Text>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  links: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  linkText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.text,
    textTransform: 'lowercase',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
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
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
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
    color: colors.textMuted,
  },
});
