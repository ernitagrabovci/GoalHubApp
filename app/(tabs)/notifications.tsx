import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_NOTIFICATIONS, type AppNotification } from '@/lib/data';

const TYPE_ICON: Record<string, { icon: 'stethoscope' | 'figure.soccer' | 'star.fill' | 'bubble.left.fill'; color: string }> = {
  injury_registered: { icon: 'stethoscope', color: '#E24B4A' },
  match_scheduled: { icon: 'figure.soccer', color: '#F5A623' },
  rating_saved: { icon: 'star.fill', color: '#534AB7' },
  message: { icon: 'bubble.left.fill', color: '#185FA5' },
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>(ALL_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <Screen back>
      <DetailHead
        icon="notifications"
        accent="#F5A623"
        title="notifications"
        subtitle={unread ? `${unread} unread · tap to mark read` : 'all caught up'}
      />

      <View style={styles.links}>
        <Pressable style={styles.link} onPress={markAllRead}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#2fbf71" />
          <Text style={styles.linkText}>mark all read</Text>
        </Pressable>
      </View>

      <SectionLabel>{unread ? 'unread' : 'inbox'}</SectionLabel>
      <View style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No notifications yet.</Text>
        ) : (
          items.map((n) => {
            const meta = TYPE_ICON[n.type] ?? { icon: 'notifications' as const, color: Colors.textMuted };
            return (
              <Pressable
                key={n.id}
                style={[styles.card, !n.read && styles.cardUnread]}
                onPress={() => markRead(n.id)}>
                <IconTile icon={meta.icon} color={meta.color} />
                <View style={styles.body}>
                  <Text style={[styles.title, !n.read && styles.titleUnread]}>{n.title}</Text>
                  <Text style={styles.text}>{n.body}</Text>
                  <Text style={styles.meta}>
                    {n.source} · {n.time}
                  </Text>
                </View>
                {!n.read ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })
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
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  cardUnread: {
    borderColor: Colors.mint,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  titleUnread: {
    color: Colors.mint,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  meta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
