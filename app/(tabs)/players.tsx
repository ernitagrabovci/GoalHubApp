import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS, type Health } from '@/lib/data';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'muted',
};

const HEALTH_LABEL: Record<Health, string> = {
  active: 'active',
  injured: 'injured',
  rehabilitation: 'rehab',
  suspended: 'suspended',
};

export default function PlayersScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_PLAYERS;
    return ALL_PLAYERS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        String(p.number).includes(q),
    );
  }, [query]);

  return (
    <Screen>
      <DetailHead
        icon="person.2.fill"
        accent={Colors.mint}
        title="squad"
        subtitle={`${ALL_PLAYERS.length} players · FC Prishtina`}
      />

      {/* Quick links */}
      <View style={styles.links}>
        <Pressable style={styles.link} onPress={() => router.push('/ratings')}>
          <IconSymbol name="star.fill" size={16} color="#f5a623" />
          <Text style={styles.linkText}>ratings</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/attendance')}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#2fbf71" />
          <Text style={styles.linkText}>attendance</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <IconSymbol name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or position…"
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

      <SectionLabel>players</SectionLabel>
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No players match that search.</Text>
        ) : (
          filtered.map((p) => (
            <ListRow
              key={p.id}
              title={p.name}
              subtitle={`${p.position} · No. ${p.number} · ★ ${p.rating.toFixed(1)}`}
              leading={<InitialsTile initials={p.initials} color={p.color} />}
              trailing={<StatusChip label={HEALTH_LABEL[p.health]} tone={HEALTH_TONE[p.health]} />}
              onPress={() => router.push(`/player?id=${p.id}`)}
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
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
