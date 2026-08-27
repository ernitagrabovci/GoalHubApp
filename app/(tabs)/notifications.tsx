import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_NOTIFICATIONS, type AppNotification } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const TYPE_ICON: Record<string, { icon: IconSymbolName; color: string }> = {
  injury_registered: { icon: 'stethoscope', color: '#E24B4A' },
  match_scheduled: { icon: 'figure.soccer', color: '#F5A623' },
  rating_saved: { icon: 'star.fill', color: '#534AB7' },
  message: { icon: 'bubble.left.fill', color: '#185FA5' },
  notice: { icon: 'notifications', color: '#B0E4CC' },
};

const AUDIENCES = ['everyone', 'players', 'team'] as const;

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { user } = useSession();
  const canSend = user?.role === 'administrator' || user?.role === 'trainer';
  const [items, setItems] = usePersistedState<AppNotification[]>('notifications:list', ALL_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const [showForm, setShowForm] = useState(false);
  const [audience, setAudience] = useState<string>(AUDIENCES[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const send = () => {
    if (!title.trim()) {
      alert(t('notifications.alertTitle'));
      return;
    }
    setItems((prev) => [
      {
        id: `n-${Date.now()}`,
        type: 'notice',
        title: title.trim(),
        body: body.trim(),
        source: user?.name ?? 'Admin',
        time: 'Now',
        read: false,
      },
      ...prev,
    ]);
    setTitle('');
    setBody('');
    setShowForm(false);
    alert(t('notifications.alertSent'));
  };

  return (
    <Screen back>
      <DetailHead
        icon="notifications"
        accent="#F5A623"
        title={t('notifications.title')}
        subtitle={unread ? t('notifications.unreadTap', { unread }) : t('notifications.allCaughtUp')}
      />

      <View style={styles.links}>
        <Pressable style={styles.link} onPress={markAllRead}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#2fbf71" />
          <Text style={styles.linkText}>{t('notifications.markAllRead')}</Text>
        </Pressable>
      </View>

      {canSend ? (
        <>
          {showForm ? (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>{t('notifications.audience')}</Text>
              <View style={styles.wrap}>
                {AUDIENCES.map((a) => {
                  const selected = audience === a;
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setAudience(a)}
                      style={[styles.chip, selected && styles.chipActive]}>
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {t(`notifications.${a}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('notifications.formTitle')}
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, styles.bodyInput]}
                placeholder={t('notifications.formBody')}
                placeholderTextColor={Colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
              />
              <Pressable style={styles.sendBtn} onPress={send}>
                <IconSymbol name="paperplane.fill" size={16} color={Colors.textOnPrimary} />
                <Text style={styles.sendBtnText}>{t('notifications.send')}</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable style={styles.action} onPress={() => setShowForm((s) => !s)}>
            <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={Colors.textOnPrimary} />
            <Text style={styles.actionText}>
              {showForm ? t('common.closeForm') : t('notifications.send')}
            </Text>
          </Pressable>
        </>
      ) : null}

      <SectionLabel>{t(unread ? 'notifications.unread' : 'notifications.inbox')}</SectionLabel>
      <View style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>{t('notifications.empty')}</Text>
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
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  bodyInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  sendBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  action: {
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
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
