import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS, ALL_TEAMS, type Health, type Player, type Team } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'muted',
};

const POSITIONS = ['GK', 'DF', 'MF', 'FW'] as const;
const PALETTE = ['#B0E4CC', '#408A71', '#2fbf71', '#8f86e8', '#5aa7e6', '#f5a623', '#86C2A4', '#E24B4A', '#ba7517', '#993556', '#185fa5'];

function NewPlayerForm({ teams, onDone }: { teams: Team[]; onDone: (p: Player, teamId: string) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState<string>(teams[0]?.id ?? '');
  const [position, setPosition] = useState<string>(POSITIONS[0]);
  const [number, setNumber] = useState('');
  const [age, setAge] = useState('');

  const submit = () => {
    if (!name.trim()) {
      alert(t('players.alertName'));
      return;
    }
    const initials = name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    onDone(
      {
        id: `p-${Date.now()}`,
        name: name.trim(),
        initials,
        position,
        number: parseInt(number, 10) || 0,
        age: parseInt(age, 10) || 0,
        rating: 6.0,
        health: 'active',
        color: PALETTE[teams.length % PALETTE.length],
        team: teams.find((tm) => tm.id === teamId)?.name,
      },
      teamId,
    );
    setName('');
    setNumber('');
    setAge('');
    setPosition(POSITIONS[0]);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{t('players.registerPlayer')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('players.name')}
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        autoCorrect={false}
      />
      <Text style={styles.fieldLabel}>{t('players.team')}</Text>
      <View style={styles.wrap}>
        {teams.map((tm) => {
          const selected = teamId === tm.id;
          return (
            <Pressable
              key={tm.id}
              onPress={() => setTeamId(tm.id)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{tm.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>{t('players.position')}</Text>
      <View style={styles.wrap}>
        {POSITIONS.map((pos) => {
          const selected = position === pos;
          return (
            <Pressable
              key={pos}
              onPress={() => setPosition(pos)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{pos}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.numBox]}>
          <TextInput
            style={styles.input}
            placeholder={t('players.number')}
            placeholderTextColor={Colors.textMuted}
            value={number}
            onChangeText={setNumber}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputBox, styles.ageBox]}>
          <TextInput
            style={styles.input}
            placeholder={t('players.age')}
            placeholderTextColor={Colors.textMuted}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>
      </View>
      <Pressable style={styles.submitBtn} onPress={submit}>
        <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.submitBtnText}>{t('players.registerPlayer')}</Text>
      </Pressable>
    </View>
  );
}

export default function PlayersScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const canManage = user?.role === 'administrator' || user?.role === 'trainer';
  const [players, setPlayers] = usePersistedState<Player[]>('players:list', ALL_PLAYERS);
  const [teams, setTeams] = usePersistedState<Team[]>('teams:list', ALL_TEAMS);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        String(p.number).includes(q),
    );
  }, [query, players]);

  const addPlayer = (p: Player, teamId: string) => {
    setPlayers((prev) => [p, ...prev]);
    setTeams((prev) =>
      prev.map((tm) =>
        tm.id === teamId
          ? {
              ...tm,
              members: [
                ...tm.members,
                { name: p.name, initials: p.initials, color: p.color, position: p.position, number: p.number },
              ],
            }
          : tm,
      ),
    );
    setShowForm(false);
    alert(t('players.alertAdded', { name: p.name }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="person.2.fill"
        accent={Colors.mint}
        title={t('players.title')}
        subtitle={t('players.subtitle', { count: players.length })}
      />

      {/* Quick links */}
      <View style={styles.links}>
        <Pressable style={styles.link} onPress={() => router.push('/ratings')}>
          <IconSymbol name="star.fill" size={16} color="#f5a623" />
          <Text style={styles.linkText}>{t('players.ratings')}</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/attendance')}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#2fbf71" />
          <Text style={styles.linkText}>{t('players.attendance')}</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <IconSymbol name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('players.search')}
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

      {canManage && showForm ? <NewPlayerForm teams={teams} onDone={addPlayer} /> : null}

      <SectionLabel>{t('players.section')}</SectionLabel>
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>{t('players.empty')}</Text>
        ) : (
          filtered.map((p) => (
            <ListRow
              key={p.id}
              title={p.name}
              subtitle={`${p.position} · No. ${p.number} · ★ ${p.rating.toFixed(1)}`}
              leading={<InitialsTile initials={p.initials} color={p.color} />}
              trailing={<StatusChip label={t(`health.${p.health}`)} tone={HEALTH_TONE[p.health]} />}
              onPress={() => router.push(`/player?id=${p.id}`)}
            />
          ))
        )}
      </View>

      {canManage ? (
        <Pressable style={styles.action} onPress={() => setShowForm((s) => !s)}>
          <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={Colors.textOnPrimary} />
          <Text style={styles.actionText}>
            {showForm ? t('common.closeForm') : t('players.registerPlayer')}
          </Text>
        </Pressable>
      ) : null}
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
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
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
  inputBox: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  numBox: {
    width: 96,
  },
  ageBox: {
    flex: 1,
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
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
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
