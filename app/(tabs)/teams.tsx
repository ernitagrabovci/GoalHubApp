import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TEAMS } from '@/lib/data';

export default function TeamsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <DetailHead
        icon="person.2.fill"
        accent="#1a9e5c"
        title="teams"
        subtitle={`${ALL_TEAMS.length} squads · FC Prishtina`}
      />

      <SectionLabel>squads</SectionLabel>
      <View style={styles.list}>
        {ALL_TEAMS.map((t) => (
          <Pressable
            key={t.id}
            style={styles.card}
            onPress={() => router.push(`/team?id=${t.id}`)}>
            <View style={[styles.teamIcon, { backgroundColor: `${t.color}22` }]}>
              <IconSymbol name="person.2.fill" size={20} color={t.color} />
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.meta}>
                {t.category} · {t.season}
              </Text>
              <Text style={styles.meta}>
                {t.members.length} player{t.members.length === 1 ? '' : 's'} · {t.trainer}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.action} onPress={() => alert('Create team — coming soon')}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.actionText}>new team</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  action: {
    marginTop: Spacing.xl,
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
});
