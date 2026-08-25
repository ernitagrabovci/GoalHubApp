import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  ALL_PLAYERS,
  ALL_RATINGS,
  PLAYER_PROFILES,
  PLAYER_SEASON,
  feesForRole,
  type FeeStatus,
  type Health,
} from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'purple',
};

const FEE_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

const SECTIONS: { label: string; icon: IconSymbolName; tint: string; route: string }[] = [
  { label: 'attendance', icon: 'calendar', tint: '#408A71', route: '/child-attendance' },
  { label: 'ratings', icon: 'star.fill', tint: '#f5a623', route: '/child-ratings' },
  { label: 'fees', icon: 'dollarsign.circle.fill', tint: '#2fbf71', route: '/fees' },
  { label: 'trainings', icon: 'event', tint: '#B0E4CC', route: '/trainings' },
  { label: 'matches', icon: 'figure.soccer', tint: '#185FA5', route: '/matches' },
];

export default function ChildScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const child = ALL_PLAYERS.find((p) => p.name === 'Agon Gashi') ?? ALL_PLAYERS[0];
  const season = PLAYER_SEASON[child.name];
  const profile = PLAYER_PROFILES[child.name];
  const rating = ALL_RATINGS.find((r) => r.player === child.name);
  const fees = feesForRole('parent');
  const currentFee = fees[0];

  return (
    <Screen back>
      {/* Child card — read-only */}
      <View style={styles.card}>
        <InitialsTile initials={child.initials} color={child.color} size={56} />
        <View style={styles.cardBody}>
          <Text style={styles.kicker}>{t('child.yourChild')}</Text>
          <Text style={styles.name}>{child.name}</Text>
          <Text style={styles.meta}>
            {t('common.personMeta', { position: child.position, number: child.number, age: child.age })} · {profile.team}
          </Text>
          <View style={styles.tags}>
            <StatusChip label={t(`health.${child.health}`)} tone={HEALTH_TONE[child.health]} />
            <View style={styles.ratingChip}>
              <IconSymbol name="star.fill" size={11} color="#f5a623" />
              <Text style={styles.ratingText}>{child.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel>{t('child.seasonStats')}</SectionLabel>
      <View style={styles.summary}>
        <StatCell value={String(season.matches)} label={t('stats.matches')} />
        <StatCell value={String(season.goals)} label={t('stats.goals')} color="#f5a623" />
        <StatCell value={String(season.assists)} label={t('stats.assists')} />
        <StatCell value={`${season.yellow}/${season.red}`} label={t('stats.cards')} color={Colors.warning} />
      </View>

      <SectionLabel>{t('child.view')}</SectionLabel>
      <View style={styles.grid}>
        {SECTIONS.map((s) => (
          <Pressable key={s.label} style={styles.cell} onPress={() => router.push(s.route as never)}>
            <View style={[styles.cellIcon, { backgroundColor: `${s.tint}1f` }]}>
              <IconSymbol name={s.icon} size={22} color={s.tint} />
            </View>
            <Text style={styles.cellLabel}>{t(`child.${s.label}`)}</Text>
          </Pressable>
        ))}
      </View>

      {rating ? (
        <>
          <SectionLabel>{t('child.latestRating')}</SectionLabel>
          <Pressable style={styles.ratingCard} onPress={() => router.push('/child-ratings')}>
            <Text style={styles.ratingAvg}>{rating.average.toFixed(1)}</Text>
            <View style={styles.ratingBody}>
              <Text style={styles.ratingTitle}>{t('child.ratedBy', { name: rating.by })}</Text>
              <Text style={styles.ratingComment} numberOfLines={2}>
                “{rating.comment}”
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        </>
      ) : null}

      {currentFee ? (
        <>
          <SectionLabel>{t('child.feeStatus')}</SectionLabel>
          <Pressable style={styles.feeCard} onPress={() => router.push('/fees')}>
            <View style={styles.feeBody}>
              <Text style={styles.feeLabel}>
                {currentFee.month} · {currentFee.amount}
              </Text>
              <Text style={styles.feeSub}>{t('child.membershipFee', { name: currentFee.name })}</Text>
            </View>
            <StatusChip label={t(`status.${currentFee.status}`)} tone={FEE_TONE[currentFee.status]} />
          </Pressable>
        </>
      ) : null}

      <Text style={styles.note}>{t('child.readOnly')}</Text>
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
    gap: 2,
  },
  kicker: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  ratingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#f5a623',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  cell: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  cellIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  ratingAvg: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: '#f5a623',
  },
  ratingBody: {
    flex: 1,
    gap: 2,
  },
  ratingTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  ratingComment: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  feeBody: {
    flex: 1,
    gap: 1,
  },
  feeLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  feeSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  note: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
