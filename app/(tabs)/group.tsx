import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_GROUPS, ALL_PLAYERS } from '@/lib/data';

function playerId(name: string) {
  return ALL_PLAYERS.find((p) => p.name === name)?.id ?? '';
}

export default function GroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const group = ALL_GROUPS.find((g) => g.id === id) ?? ALL_GROUPS[0];

  return (
    <Screen back>
      {/* Group card */}
      <View style={styles.card}>
        <InitialsTile initials={group.name.slice(0, 2).toUpperCase()} color={group.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.type}>{group.type}</Text>
          <View style={styles.metaRow}>
            <IconSymbol name="person.fill" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {group.members.length} player{group.members.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </View>

      <SectionLabel>members</SectionLabel>
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

      <SectionLabel>about</SectionLabel>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutText}>
          {group.name} is a {group.type.toLowerCase()} for focused work. Use the group to send
          targeted messages and run position-specific drills during training.
        </Text>
      </View>

      <Pressable
        style={styles.msgBtn}
        onPress={() => {
          alert(`Opening a group chat with ${group.name} — coming soon.`);
        }}>
        <IconSymbol name="bubble.left.fill" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.msgBtnText}>message group</Text>
      </Pressable>
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
  msgBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  msgBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
