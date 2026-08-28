import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ring, StatBar } from '@/components/chart';
import { Screen, DetailHead, StatCell, SectionLabel } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_MATCHES, ALL_NOTIFICATIONS, ALL_RATINGS, feesForRole } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

function resultOf(score: string): 'W' | 'D' | 'L' {
  const [a, b] = score.split('–').map((s) => parseInt(s.trim(), 10));
  if (a > b) return 'W';
  if (a < b) return 'L';
  return 'D';
}

const RESULT_TONE = { W: 'emerald', D: 'info', L: 'danger' } as const;

export default function ReportsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [generated, setGenerated] = useState<Record<string, string | null>>({
    match: null,
    finance: null,
    activity: null,
  });
  const [date] = useState(
    () => `${new Date().getDate()} ${new Date().toLocaleString('en', { month: 'short' })}`,
  );

  const generate = (key: string, summary: string) => {
    setGenerated((prev) => ({ ...prev, [key]: summary }));
    alert(t('reports.alert'));
  };

  const played = ALL_MATCHES.filter((m) => m.status === 'played');
  const wins = played.filter((m) => resultOf(m.score ?? '0 – 0') === 'W').length;
  const draws = played.filter((m) => resultOf(m.score ?? '0 – 0') === 'D').length;
  const losses = played.length - wins - draws;
  const fees = feesForRole('administrator');
  const paid = fees.filter((f) => f.status === 'paid').length;
  const pending = fees.filter((f) => f.status === 'unpaid' || f.status === 'delayed').length;
  const critical = fees.filter((f) => f.status === 'critical').length;

  const byMonth = (month: string) => {
    const rows = fees.filter((f) => f.month === month);
    return {
      collected: String(rows.filter((f) => f.status === 'paid').length),
      pending: String(rows.filter((f) => f.status === 'unpaid' || f.status === 'delayed').length),
      critical: String(rows.filter((f) => f.status === 'critical').length),
    };
  };

  const financeRows = [
    { month: 'Sep', ...byMonth('Sep') },
    { month: 'Aug', ...byMonth('Aug') },
    { month: 'Jul', ...byMonth('Jul') },
  ];

  const activity = ALL_NOTIFICATIONS;

  return (
    <Screen back>
      <DetailHead
        icon="chart.bar.fill"
        accent="#B0E4CC"
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
      />

      {/* Overview */}
      <View style={styles.statsRow}>
        <StatCell value={String(played.length)} label={t('reports.matches')} color="#B0E4CC" />
        <StatCell value={String(wins)} label={t('reports.wins')} color={colors.emerald} />
        <StatCell value={`${ALL_RATINGS.length}`} label={t('reports.ratings')} color="#f5a623" />
      </View>

      <SectionLabel>{t('reports.matchReport')}</SectionLabel>
      <View style={styles.rowsCard}>
        {played.map((m) => {
          const res = resultOf(m.score ?? '0 – 0');
          return (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{m.opponent}</Text>
                <Text style={styles.rowMeta}>{m.competition} · {m.day} {m.month}</Text>
              </View>
              <Text style={styles.score}>{m.score}</Text>
              <StatusChip label={res} tone={RESULT_TONE[res]} />
            </View>
          );
        })}
      </View>

      {/* Results breakdown */}
      <View style={styles.resultsCard}>
        <Ring
          size={88}
          stroke={7}
          progress={played.length ? wins / played.length : 0}
          color={colors.emerald}
          label={played.length ? `${Math.round((wins / played.length) * 100)}%` : '–'}
          sublabel="win rate"
        />
        <View style={styles.resultsBars}>
          <StatBar label="wins" value={wins} max={played.length || 1} color={colors.emerald} display={String(wins)} />
          <StatBar label="draws" value={draws} max={played.length || 1} color={colors.info} display={String(draws)} />
          <StatBar label="losses" value={losses} max={played.length || 1} color={colors.danger} display={String(losses)} />
        </View>
      </View>

      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('match', `${played.length} played · ${wins} wins · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={colors.mint} />
        <Text style={styles.exportText}>{t('reports.exportMatches')}</Text>
      </Pressable>
      {generated.match ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={colors.emerald} />
          <Text style={styles.generatedText}>
            {t('reports.generatedMatch', { summary: generated.match })}
          </Text>
        </View>
      ) : null}

      <SectionLabel>{t('reports.financeReport')}</SectionLabel>
      <View style={styles.rowsCard}>
        {financeRows.map((r) => (
          <View key={r.month} style={styles.row}>
            <Text style={styles.rowTitle}>{r.month}</Text>
            <View style={styles.monthCol}>
              <Text style={[styles.countText, { color: colors.emerald }]}>
                {t('reports.paid', { count: r.collected })}
              </Text>
              <Text style={styles.countSub}>
                {r.pending} {t('finance.pending')} · {r.critical} {t('status.critical')}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('finance', `${paid} paid · ${pending} pending · ${critical} critical · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={colors.mint} />
        <Text style={styles.exportText}>{t('reports.exportFinance')}</Text>
      </Pressable>
      {generated.finance ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={colors.emerald} />
          <Text style={styles.generatedText}>
            {t('reports.generatedFinance', { summary: generated.finance })}
          </Text>
        </View>
      ) : null}

      <SectionLabel>{t('reports.platformActivity')}</SectionLabel>
      <View style={styles.rowsCard}>
        {activity.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowMeta}>{a.source} · {a.time}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </View>
        ))}
      </View>
      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('activity', `${activity.length} events · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={colors.mint} />
        <Text style={styles.exportText}>{t('reports.exportActivity')}</Text>
      </Pressable>
      {generated.activity ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={colors.emerald} />
          <Text style={styles.generatedText}>
            {t('reports.generatedActivity', { summary: generated.activity })}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rowsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  resultsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  resultsBars: {
    flex: 1,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  score: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: colors.mint,
  },
  monthCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  countText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  countSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  exportText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  generatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: `${colors.emerald}1a`,
    borderColor: `${colors.emerald}55`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  generatedText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.emerald,
  },
});
