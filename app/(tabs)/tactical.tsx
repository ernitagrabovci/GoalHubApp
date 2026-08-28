import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { DEFAULT_SCENES, type TacticalScene } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

export default function TacticalScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const viewer = user?.role === 'player' || user?.role === 'parent';
  const [scenes, setScenes] = useState<TacticalScene[]>(DEFAULT_SCENES);

  const toggleShare = (id: string) =>
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, shared: !s.shared } : s)));

  const visible = viewer ? scenes.filter((s) => s.shared) : scenes;

  return (
    <Screen back>
      <DetailHead
        icon="map.fill"
        accent={colors.mintDim}
        title={t('tactical.title')}
        subtitle={
          viewer
            ? t('tactical.subtitleShared', { count: visible.length })
            : t('tactical.subtitleOwn', { count: visible.length })
        }
      />

      <SectionLabel>{viewer ? t('tactical.sharedScenes') : t('tactical.savedScenes')}</SectionLabel>
      <View style={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>
            {viewer ? t('tactical.emptyShared') : t('tactical.emptyOwn')}
          </Text>
        ) : (
          visible.map((scene) => (
            <Pressable
              key={scene.id}
              style={styles.card}
              onPress={() => router.push(`/tactical-editor?id=${scene.id}`)}>
              <View style={[styles.sceneIcon, { backgroundColor: `${colors.mintDim}22` }]}>
                <IconSymbol name="map.fill" size={20} color={colors.mintDim} />
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{scene.name}</Text>
                <Text style={styles.meta}>
                  {t('tactical.metaPlayers', { formation: scene.formation, count: scene.players.length })}
                </Text>
                <Text style={styles.meta}>
                  {t('tactical.createdModified', { created: scene.created, modified: scene.modified })}
                </Text>
              </View>
              {viewer ? null : (
                <Pressable
                  style={[styles.shareBtn, scene.shared && styles.shareBtnOn]}
                  onPress={() => toggleShare(scene.id)}
                  hitSlop={8}>
                  <IconSymbol
                    name="square.and.arrow.up"
                    size={14}
                    color={scene.shared ? colors.textOnPrimary : colors.mint}
                  />
                </Pressable>
              )}
            </Pressable>
          ))
        )}
      </View>

      {viewer ? null : (
        <Pressable
          style={styles.action}
          onPress={() => router.push('/tactical-editor')}>
          <IconSymbol name="plus" size={18} color={colors.textOnPrimary} />
          <Text style={styles.actionText}>{t('tactical.newScene')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sceneIcon: {
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
    fontSize: 14,
    color: colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
  },
  shareBtnOn: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  action: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
