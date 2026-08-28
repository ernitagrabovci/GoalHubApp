import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import {
  CLUB_FIELDS,
  CLUB_PROFILE,
  CLUB_SEASONS,
  type ClubField,
  type ClubSeason,
} from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

export default function ClubScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [seasons, setSeasons] = usePersistedState<ClubSeason[]>('club:seasons', CLUB_SEASONS);
  const [fields, setFields] = usePersistedState<ClubField[]>('club:fields', CLUB_FIELDS);
  const [showSeason, setShowSeason] = useState(false);
  const [seasonLabel, setSeasonLabel] = useState('');
  const [showField, setShowField] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');

  const activate = (id: string) =>
    setSeasons((prev) => prev.map((s) => ({ ...s, active: s.id === id })));

  const addSeason = () => {
    if (!seasonLabel.trim()) {
      alert(t('club.alertSeasonLabel'));
      return;
    }
    setSeasons((prev) => [
      ...prev.map((s) => ({ ...s, active: false })),
      { id: `s-${Date.now()}`, label: seasonLabel.trim(), active: true },
    ]);
    setSeasonLabel('');
    setShowSeason(false);
    alert(t('club.alertSeasonCreated', { label: seasonLabel.trim() }));
  };

  const addField = () => {
    if (!fieldName.trim() || !fieldLocation.trim()) {
      alert(t('club.alertField'));
      return;
    }
    setFields((prev) => [
      ...prev,
      { id: `f-${Date.now()}`, name: fieldName.trim(), location: fieldLocation.trim(), status: 'active' },
    ]);
    setFieldName('');
    setFieldLocation('');
    setShowField(false);
    alert(t('club.alertFieldAdded', { name: fieldName.trim() }));
  };

  const profileRows = [
    { label: t('club.founded'), value: String(CLUB_PROFILE.founded) },
    { label: t('club.league'), value: CLUB_PROFILE.league },
    { label: t('club.stadium'), value: CLUB_PROFILE.stadium },
    { label: t('club.address'), value: CLUB_PROFILE.address },
    { label: t('club.phone'), value: CLUB_PROFILE.phone },
    { label: t('club.email'), value: CLUB_PROFILE.email },
  ];

  return (
    <Screen back>
      <DetailHead
        icon="trophy.fill"
        accent={colors.mintDim}
        title={t('club.title')}
        subtitle={t('club.subtitle')}
      />

      {/* Club card */}
      <View style={styles.clubCard}>
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/goalhub-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.clubBody}>
          <Text style={styles.clubName}>{CLUB_PROFILE.name}</Text>
          <Text style={styles.clubSub}>
            {t('club.foundedMeta', { founded: CLUB_PROFILE.founded, league: CLUB_PROFILE.league })}
          </Text>
        </View>
      </View>

      <SectionLabel>{t('club.profile')}</SectionLabel>
      <View style={styles.rowsCard}>
        {profileRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{t('club.season')}</SectionLabel>
      <View style={styles.chips}>
        {seasons.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => {
              if (!s.active) {
                activate(s.id);
                alert(t('club.alertSeasonActivated', { label: s.label }));
              }
            }}
            style={[styles.chip, s.active && styles.chipActive]}>
            <Text style={[styles.chipText, s.active && styles.chipTextActive]}>{s.label}</Text>
            {s.active ? <IconSymbol name="checkmark.circle.fill" size={13} color={colors.textOnPrimary} /> : null}
          </Pressable>
        ))}
      </View>
      {showSeason ? (
        <View style={styles.inlineForm}>
          <TextInput
            style={styles.input}
            placeholder={t('club.seasonPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={seasonLabel}
            onChangeText={setSeasonLabel}
            autoCorrect={false}
          />
          <Pressable style={styles.inlineAdd} onPress={addSeason}>
            <IconSymbol name="plus" size={15} color={colors.textOnPrimary} />
            <Text style={styles.inlineAddText}>{t('club.createSeason')}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.addSeason} onPress={() => setShowSeason(true)}>
          <IconSymbol name="plus" size={15} color={colors.mint} />
          <Text style={styles.addSeasonText}>{t('club.newSeason')}</Text>
        </Pressable>
      )}

      <SectionLabel>{t('club.trainingFields')}</SectionLabel>
      <View style={styles.list}>
        {fields.length === 0 ? (
          <Text style={styles.emptyText}>{t('club.emptyFields')}</Text>
        ) : (
          fields.map((f) => (
            <View key={f.id} style={styles.fieldCard}>
              <View style={[styles.fieldIcon, { backgroundColor: `${colors.mint}22` }]}>
                <IconSymbol name="map.fill" size={18} color={colors.mint} />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldName}>{f.name}</Text>
                <Text style={styles.fieldMeta}>{f.location}</Text>
              </View>
              <StatusChip
                label={t(f.status === 'active' ? 'users.active' : 'users.inactive')}
                tone={f.status === 'active' ? 'emerald' : 'warning'}
              />
            </View>
          ))
        )}
      </View>
      {showField ? (
        <View style={styles.inlineForm}>
          <TextInput
            style={styles.input}
            placeholder={t('club.fieldPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={fieldName}
            onChangeText={setFieldName}
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t('club.locationPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={fieldLocation}
            onChangeText={setFieldLocation}
            autoCorrect={false}
          />
          <Pressable style={styles.inlineAdd} onPress={addField}>
            <IconSymbol name="plus" size={15} color={colors.textOnPrimary} />
            <Text style={styles.inlineAddText}>{t('club.addField')}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.addField} onPress={() => setShowField(true)}>
          <IconSymbol name="plus" size={15} color={colors.mint} />
          <Text style={styles.addFieldText}>{t('club.addField')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.mint}22`,
  },
  logo: {
    width: 34,
    height: 34,
  },
  clubBody: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  clubSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
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
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  inlineForm: {
    marginTop: Spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  inlineAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  inlineAddText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  addSeason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  addSeasonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: {
    flex: 1,
    gap: 1,
  },
  fieldName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  fieldMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  addField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  addFieldText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.mint,
    textTransform: 'lowercase',
  },
});
