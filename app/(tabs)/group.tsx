import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_GROUPS, ALL_PLAYERS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';

type ChatMsg = { id: string; text: string; time: string; mine: boolean };

function playerId(name: string) {
  return ALL_PLAYERS.find((p) => p.name === name)?.id ?? '';
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function GroupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const group = ALL_GROUPS.find((g) => g.id === id) ?? ALL_GROUPS[0];

  const [msgs, setMsgs] = usePersistedState<ChatMsg[]>(`group:${group.id}:chat`, [
    {
      id: 'seed1',
      text: `Welcome to ${group.name} — use this chat for ${group.type.toLowerCase()} talk.`,
      time: '09:00',
      mine: false,
    },
  ]);
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim()) return;
    setMsgs((prev) => [...prev, { id: `m-${Date.now()}`, text: draft.trim(), time: nowTime(), mine: true }]);
    setDraft('');
  };

  return (
    <Screen back>
      {/* Group card */}
      <View style={styles.card}>
        <InitialsTile initials={group.name.slice(0, 2).toUpperCase()} color={group.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.type}>{t(`group.type.${group.type}`)}</Text>
          <View style={styles.metaRow}>
            <IconSymbol name="person.fill" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {group.members.length} {t(group.members.length === 1 ? 'common.player' : 'common.players')}
            </Text>
          </View>
        </View>
      </View>

      <SectionLabel>{t('group.members')}</SectionLabel>
      <View style={styles.list}>
        {group.members.map((m) => (
          <ListRow
            key={m.initials}
            title={m.name}
            leading={<InitialsTile initials={m.initials} color={m.color} size={38} />}
            onPress={() => router.push(`/player?id=${playerId(m.name)}`)}
          />
        ))}
      </View>

      <SectionLabel>{t('group.about')}</SectionLabel>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutText}>
          {t('group.aboutText', { name: group.name, type: t(`group.type.${group.type}`) })}
        </Text>
      </View>

      <SectionLabel>{t('group.groupChat')}</SectionLabel>
      <View style={styles.thread}>
        {msgs.map((m) => (
          <View key={m.id} style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, m.mine && styles.bubbleTextMine]}>{m.text}</Text>
            <Text style={[styles.bubbleTime, m.mine && styles.bubbleTimeMine]}>{m.time}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('group.messagePlaceholder', { name: group.name })}
          placeholderTextColor={Colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          autoCorrect={false}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send} hitSlop={6}>
          <IconSymbol name="paperplane.fill" size={18} color={Colors.textOnPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  type: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  list: {
    gap: Spacing.md,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  aboutText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  thread: {
    gap: Spacing.sm,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.mint,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  bubbleTextMine: {
    color: Colors.textOnPrimary,
  },
  bubbleTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: `${Colors.textOnPrimary}99`,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mint,
  },
});
