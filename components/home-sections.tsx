import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatBar } from '@/components/chart';
import { DateTile, IconTile, InitialsTile, ListRow } from '@/components/list-row';
import { StatCell } from '@/components/screen';
import { StatusChip, TONE_COLORS, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import {
  ALL_MATCHES,
  ALL_NOTIFICATIONS,
  ALL_PLAYERS,
  ALL_TEAMS,
  ALL_TRAININGS,
  PLAYER_SEASON,
  TRAINING_ATTENDANCE,
  feesForRole,
  type AttendanceStatus,
  type Fee,
  type FeeStatus,
  type Injury,
  type Rating,
} from '@/lib/data';
import type { Role } from '@/lib/session';
import { injuriesStore, ratingsStore, useCollection } from '@/lib/store';

const STATUS_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

const ATT_STATUS: Record<AttendanceStatus, { icon: IconSymbolName; tone: StatusTone }> = {
  present: { icon: 'checkmark.circle.fill', tone: 'emerald' },
  absent: { icon: 'xmark', tone: 'danger' },
  unconfirmed: { icon: 'clock.fill', tone: 'warning' },
};

const NOTIF_ICON: Record<string, { icon: IconSymbolName; color: string }> = {
  injury_registered: { icon: 'stethoscope', color: TONE_COLORS.danger },
  match_scheduled: { icon: 'figure.soccer', color: TONE_COLORS.info },
  rating_saved: { icon: 'star.fill', color: TONE_COLORS.warning },
  message: { icon: 'bubble.left.fill', color: TONE_COLORS.emerald },
};

const upcomingMatches = ALL_MATCHES.filter((m) => m.status === 'upcoming');
const attendancePct = Math.round(
  (ALL_TRAININGS.reduce((s, t) => s + t.present, 0) /
    ALL_TRAININGS.reduce((s, t) => s + t.total, 0)) *
    100
);
const playerAttendance = Math.round(
  (Object.values(TRAINING_ATTENDANCE).filter((rows) =>
    rows.some((r) => r.player === 'Ardit Llapashtica' && r.status === 'present')
  ).length /
    Object.keys(TRAINING_ATTENDANCE).length) *
    100
);

function amount(fee: Fee): number {
  const n = parseFloat(fee.amount.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function feeAgg(fees: Fee[]) {
  const counts: Record<FeeStatus, number> = { paid: 0, unpaid: 0, delayed: 0, critical: 0 };
  const sums: Record<FeeStatus, number> = { paid: 0, unpaid: 0, delayed: 0, critical: 0 };
  for (const f of fees) {
    counts[f.status] += 1;
    sums[f.status] += amount(f);
  }
  return { counts, sums };
}

type Stat = { labelKey: string; value: string; icon: IconSymbolName; tint: string };

function roleStats(role: Role, t: (key: string) => string, injuries: Injury[], ratings: Rating[]): Stat[] {
  const allFees = feesForRole(role);
  const agg = feeAgg(allFees);
  const ardit = ALL_PLAYERS.find((p) => p.name === 'Ardit Llapashtica') ?? ALL_PLAYERS[0];
  const arditRating = ratings.find((r) => r.player === ardit.name)?.average ?? ardit.rating;
  const parentFees = feesForRole('parent');
  const sepIncome = allFees
    .filter((f) => f.month === 'Sep' && f.status === 'paid')
    .reduce((s, f) => s + amount(f), 0);
  const activeCount = injuries.filter((i) => i.status !== 'recovered').length;

  switch (role) {
    case 'administrator':
      return [
        { labelKey: 'stats.players', value: String(ALL_PLAYERS.length), icon: 'person.2.fill', tint: '#B0E4CC' },
        { labelKey: 'stats.teams', value: String(ALL_TEAMS.length), icon: 'trophy.fill', tint: '#408A71' },
        { labelKey: 'stats.income', value: `€${sepIncome}`, icon: 'dollarsign.circle.fill', tint: '#2fbf71' },
        { labelKey: 'stats.injuries', value: String(activeCount), icon: 'stethoscope', tint: '#E24B4A' },
      ];
    case 'trainer':
      return [
        { labelKey: 'stats.players', value: String(ALL_PLAYERS.length), icon: 'person.2.fill', tint: '#B0E4CC' },
        { labelKey: 'stats.trainings', value: String(ALL_TRAININGS.length), icon: 'calendar', tint: '#408A71' },
        { labelKey: 'stats.attendance', value: `${attendancePct}%`, icon: 'checkmark.circle.fill', tint: '#2fbf71' },
        { labelKey: 'stats.injuries', value: String(activeCount), icon: 'stethoscope', tint: '#E24B4A' },
      ];
    case 'player':
      return [
        { labelKey: 'stats.jersey', value: `#${ardit.number}`, icon: 'figure.soccer', tint: '#B0E4CC' },
        { labelKey: 'stats.attendance', value: `${playerAttendance}%`, icon: 'checkmark.circle.fill', tint: '#408A71' },
        { labelKey: 'stats.rating', value: arditRating.toFixed(1), icon: 'star.fill', tint: '#f5a623' },
        { labelKey: 'stats.health', value: t(`health.${ardit.health}`), icon: 'monitor-heart', tint: '#2fbf71' },
      ];
    case 'parent':
      return [
        { labelKey: 'stats.children', value: '1', icon: 'person.2.fill', tint: '#B0E4CC' },
        {
          labelKey: 'stats.unpaidFees',
          value: String(parentFees.filter((f) => f.status === 'unpaid').length),
          icon: 'dollarsign.circle.fill',
          tint: '#f5a623',
        },
        {
          labelKey: 'stats.activeInjuries',
          value: String(
            injuries.filter((i) => i.player === 'Agon Gashi' && i.status !== 'recovered').length
          ),
          icon: 'stethoscope',
          tint: '#E24B4A',
        },
      ];
    case 'financier':
      return [
        { labelKey: 'stats.collected', value: `€${agg.sums.paid}`, icon: 'dollarsign.circle.fill', tint: '#2fbf71' },
        { labelKey: 'stats.unpaid', value: `€${agg.sums.unpaid}`, icon: 'clock.fill', tint: '#f5a623' },
        { labelKey: 'stats.delayed', value: `€${agg.sums.delayed}`, icon: 'warning', tint: '#8f86e8' },
        { labelKey: 'stats.critical', value: `€${agg.sums.critical}`, icon: 'receipt', tint: '#E24B4A' },
      ];
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function StatGrid({ role }: { role: Role }) {
  const { t } = useLanguage();
  const injuries = useCollection(injuriesStore);
  const ratings = useCollection(ratingsStore);
  return (
    <View style={styles.statsGrid}>
      {roleStats(role, t, injuries, ratings).map((s) => (
        <View key={s.labelKey} style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${s.tint}1f` }]}>
            <IconSymbol name={s.icon} size={18} color={s.tint} />
          </View>
          <View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{t(s.labelKey)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FinanceCard({ role }: { role: Role }) {
  const router = useRouter();
  const { t } = useLanguage();
  const agg = feeAgg(feesForRole(role));
  return (
    <Pressable style={styles.financeCard} onPress={() => router.push('/fees')}>
      <StatCell value={`€${agg.sums.paid}`} label={t('stats.collected')} color={TONE_COLORS.emerald} />
      <StatCell value={`€${agg.sums.unpaid}`} label={t('stats.unpaid')} color={TONE_COLORS.warning} />
      <StatCell value={`€${agg.sums.delayed}`} label={t('stats.delayed')} color={TONE_COLORS.purple} />
      <StatCell value={`€${agg.sums.critical}`} label={t('stats.critical')} color={TONE_COLORS.danger} />
    </Pressable>
  );
}

function UpcomingMatchList() {
  const router = useRouter();
  const { t } = useLanguage();
  if (upcomingMatches.length === 0) return null;
  return (
    <View style={styles.list}>
      {upcomingMatches.map((m) => (
        <ListRow
          key={m.id}
          title={m.opponent}
          subtitle={`${t(`competition.${m.competition.toLowerCase()}`)} · ${t(`venue.${m.venue}`)}`}
          leading={<DateTile day={m.day} month={m.month} color={m.color} />}
          trailing={
            <View style={styles.timeRow}>
              <IconSymbol name="clock.fill" size={13} color={Colors.textMuted} />
              <Text style={styles.time}>{m.time}</Text>
            </View>
          }
          onPress={() => router.push(`/match?id=${m.id}`)}
        />
      ))}
    </View>
  );
}

function NotifList() {
  const router = useRouter();
  return (
    <View style={styles.list}>
      {ALL_NOTIFICATIONS.map((n) => {
        const meta = NOTIF_ICON[n.type] ?? { icon: 'notifications' as IconSymbolName, color: Colors.mint };
        return (
          <ListRow
            key={n.id}
            title={n.title}
            subtitle={n.body}
            leading={<IconTile icon={meta.icon} color={meta.color} />}
            trailing={
              <View style={styles.chatTrailing}>
                <Text style={styles.chatTime}>{n.time}</Text>
                {n.read ? null : <View style={styles.unreadDot} />}
              </View>
            }
            onPress={() => router.push('/notifications')}
          />
        );
      })}
    </View>
  );
}

function AdminSections() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <>
      {/* Admin panel hub */}
      <Pressable style={styles.adminCard} onPress={() => router.push('/admin')}>
        <View style={[styles.adminIcon, { backgroundColor: `${Colors.mint}22` }]}>
          <IconSymbol name="gearshape.fill" size={22} color={Colors.mint} />
        </View>
        <View style={styles.adminBody}>
          <Text style={styles.adminLabel}>{t('admin.panel')}</Text>
          <Text style={styles.adminSub}>{t('admin.panelSub')}</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
      </Pressable>

      <SectionTitle>{t('sections.finances')}</SectionTitle>
      <FinanceCard role="administrator" />

      <SectionTitle>{t('sections.squadSizes')}</SectionTitle>
      <Pressable style={styles.card} onPress={() => router.push('/teams')}>
        {ALL_TEAMS.map((team) => (
          <StatBar
            key={team.id}
            label={team.name}
            value={team.members.length}
            max={12}
            color={team.color}
            display={t('sections.registered', { count: team.members.length })}
          />
        ))}
      </Pressable>

      <SectionTitle>{t('sections.upcomingMatches')}</SectionTitle>
      <UpcomingMatchList />

      <SectionTitle>{t('sections.recentActivity')}</SectionTitle>
      <NotifList />
    </>
  );
}

function TrainerSections() {
  const router = useRouter();
  const { t } = useLanguage();
  const activeInjuries = useCollection(injuriesStore).filter((i) => i.status !== 'recovered');
  const today = ALL_TRAININGS[0];
  const rows = TRAINING_ATTENDANCE[today.id] ?? [];
  const counts = {
    present: rows.filter((r) => r.status === 'present').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    unconfirmed: rows.filter((r) => r.status === 'unconfirmed').length,
  };
  const overdueNames = [
    ...new Set(feesForRole('trainer').filter((f) => f.status !== 'paid').map((f) => f.name)),
  ];
  const fieldLabel = (field: string) => t(`field.${field.toLowerCase().replace(/\s+/g, '')}`);

  return (
    <>
      <SectionTitle>{t('sections.nextTraining')}</SectionTitle>
      <Pressable style={styles.infoCard} onPress={() => router.push('/trainings')}>
        <DateTile day={today.day} month={today.month} color={TONE_COLORS[today.tone]} />
        <View style={styles.infoBody}>
          <Text style={styles.infoLabel}>
            {fieldLabel(today.field)} · {today.time}
          </Text>
          <Text style={styles.infoTitle}>{t(`trainings.${today.type.toLowerCase()}`)}</Text>
          <Text style={styles.infoSub}>
            {t('sections.presentCount', { present: today.present, total: today.total })}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
      </Pressable>

      <View style={styles.attCard}>
        <View style={styles.attCounts}>
          {(['present', 'absent', 'unconfirmed'] as const).map((s) => (
            <View
              key={s}
              style={[styles.attCount, { backgroundColor: `${TONE_COLORS[ATT_STATUS[s].tone]}1a` }]}>
              <IconSymbol name={ATT_STATUS[s].icon} size={13} color={TONE_COLORS[ATT_STATUS[s].tone]} />
              <Text style={[styles.attCountText, { color: TONE_COLORS[ATT_STATUS[s].tone] }]}>
                {counts[s]} {t(`attendance.${s}`)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.attChips}>
          {rows.map((r) => {
            const tone = TONE_COLORS[ATT_STATUS[r.status].tone];
            return (
              <View
                key={r.initials}
                style={[styles.attChip, { backgroundColor: `${tone}1a`, borderColor: `${tone}45` }]}>
                <Text style={[styles.attChipText, { color: tone }]}>{r.initials}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <SectionTitle>{t('sections.thisWeekTrainings')}</SectionTitle>
      <View style={styles.list}>
        {ALL_TRAININGS.map((tr) => (
          <ListRow
            key={tr.id}
            title={t(`trainings.${tr.type.toLowerCase()}`)}
            subtitle={`${fieldLabel(tr.field)} · ${tr.time}`}
            leading={<DateTile day={tr.day} month={tr.month} color={TONE_COLORS[tr.tone]} />}
            trailing={
              <View style={styles.timeRow}>
                <IconSymbol name="person.2.fill" size={13} color={TONE_COLORS[tr.tone]} />
                <Text style={styles.time}>
                  {tr.present}/{tr.total}
                </Text>
              </View>
            }
            onPress={() => router.push('/trainings')}
          />
        ))}
      </View>

      <SectionTitle>{t('sections.upcomingMatches')}</SectionTitle>
      <UpcomingMatchList />

      <SectionTitle>{t('sections.activeInjuries')}</SectionTitle>
      <View style={styles.list}>
        {activeInjuries.map((i) => (
          <ListRow
            key={i.id}
            title={i.player}
            subtitle={`${i.type} · ${t('injuries.return', { expected: i.expected })}`}
            leading={<InitialsTile initials={i.initials} color={i.color} />}
            trailing={
              <StatusChip
                label={t(`health.${i.status}`)}
                tone={i.status === 'injured' ? 'danger' : 'warning'}
              />
            }
            onPress={() => router.push(`/injury?id=${i.id}`)}
          />
        ))}
      </View>

      <SectionTitle>{t('sections.feesNeedingAttention')}</SectionTitle>
      <Pressable style={styles.infoCard} onPress={() => router.push('/fees')}>
        <IconTile icon="clock.fill" color={TONE_COLORS.warning} />
        <View style={styles.infoBody}>
          <Text style={styles.infoLabel}>{t('sections.overdueUnpaid')}</Text>
          <Text style={styles.infoTitle}>{t('sections.playersCount', { count: overdueNames.length })}</Text>
          <Text style={styles.infoSub}>{t('sections.followUp')}</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
      </Pressable>

      <SectionTitle>{t('sections.recentNotifications')}</SectionTitle>
      <NotifList />
    </>
  );
}

function PlayerSections() {
  const router = useRouter();
  const { t } = useLanguage();
  const season = PLAYER_SEASON['Ardit Llapashtica'];
  return (
    <>
      <SectionTitle>{t('sections.seasonSoFar')}</SectionTitle>
      <Pressable style={styles.financeCard} onPress={() => router.push('/stats')}>
        <StatCell value={String(season.goals)} label={t('stats.goals')} color={Colors.mint} />
        <StatCell value={String(season.assists)} label={t('stats.assists')} color={TONE_COLORS.emerald} />
        <StatCell value={String(season.matches)} label={t('stats.matches')} color={TONE_COLORS.info} />
        <StatCell value={`${season.minutes}m`} label={t('stats.minutes')} color={TONE_COLORS.warning} />
      </Pressable>
    </>
  );
}

function FinanceSections() {
  const router = useRouter();
  const { t } = useLanguage();
  const fees = feesForRole('financier');
  const agg = feeAgg(fees);
  const recent = fees.filter((f) => f.month === 'Sep' && f.status === 'paid');
  const critical = fees.filter((f) => f.status === 'critical');
  return (
    <>
      <SectionTitle>{t('sections.statusBreakdown')}</SectionTitle>
      <View style={styles.statusGrid}>
        {(['paid', 'unpaid', 'delayed', 'critical'] as const).map((s) => (
          <View key={s} style={styles.statusCard}>
            <Text style={[styles.statusCount, { color: TONE_COLORS[STATUS_TONE[s]] }]}>{agg.counts[s]}</Text>
            <Text style={styles.statusLabel}>{t(`status.${s}`)}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>{t('sections.recentPayments')}</SectionTitle>
      <View style={styles.list}>
        {recent.map((f) => (
          <ListRow
            key={f.id}
            title={f.name}
            subtitle={`${t(`month.${f.month.toUpperCase()}`)} · ${f.amount}`}
            leading={<InitialsTile initials={f.initials} color={f.color} />}
            trailing={<StatusChip label={t('status.paid')} tone="emerald" />}
            onPress={() => router.push('/fees')}
          />
        ))}
      </View>

      <SectionTitle>{t('sections.criticalFees')}</SectionTitle>
      <View style={styles.list}>
        {critical.map((f) => (
          <ListRow
            key={f.id}
            title={f.name}
            subtitle={`${t(`month.${f.month.toUpperCase()}`)} · ${f.amount}`}
            leading={<InitialsTile initials={f.initials} color={f.color} />}
            trailing={<StatusChip label={t('status.critical')} tone="danger" />}
            onPress={() => router.push('/fees')}
          />
        ))}
      </View>
    </>
  );
}

/** Role-aware dashboard body for the Home tab — live stats plus per-role deep sections. */
export function HomeSections({ role }: { role: Role }) {
  return (
    <>
      <StatGrid role={role} />
      {role === 'administrator' ? <AdminSections /> : null}
      {role === 'trainer' ? <TrainerSections /> : null}
      {role === 'player' ? <PlayerSections /> : null}
      {role === 'financier' ? <FinanceSections /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.mint,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: `${Colors.mint}1a`,
    borderColor: Colors.mint,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  adminIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBody: {
    flex: 1,
    gap: 1,
  },
  adminLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  adminSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  list: {
    gap: Spacing.md,
  },
  financeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  infoBody: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  infoTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  infoSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  chatTrailing: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  chatTime: {
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
  attCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  attCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  attCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  attCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'lowercase',
  },
  attChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  attChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statusCard: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  statusCount: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  statusLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
