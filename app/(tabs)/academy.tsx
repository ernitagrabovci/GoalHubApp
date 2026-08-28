import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconTile, ListRow } from '@/components/list-row';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { type AcademyItem } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { academyStore, useCollection } from '@/lib/store';
import { useTheme, useThemedStyles } from '@/lib/theme';

function AcademyRow({ item, onPress }: { item: AcademyItem; onPress: () => void }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const icon: IconSymbolName = item.type === 'video' ? 'play.fill' : 'calendar';
  return (
    <ListRow
      title={item.title}
      subtitle={`${t(`category.${item.category}`)} · ${t(`level.${item.level.toLowerCase()}`)}`}
      leading={<IconTile icon={icon} color={item.color} />}
      onPress={onPress}
      trailing={
        <View style={styles.trailing}>
          <Text style={styles.duration}>{item.duration}</Text>
          {item.isShared ? (
            <View style={styles.sharedTag}>
              <IconSymbol name="link" size={10} color={colors.mintDim} />
              <Text style={styles.sharedText}>{t('academy.shared')}</Text>
            </View>
          ) : (
            <Text style={styles.privateText}>{t('academy.private')}</Text>
          )}
        </View>
      }
    />
  );
}

export default function AcademyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useSession();
  const { t } = useLanguage();
  const viewer = user?.role === 'player' || user?.role === 'parent';
  const all = useCollection(academyStore);
  const library = viewer ? all.filter((a) => a.isShared) : all;
  const videos = library.filter((a) => a.type === 'video');
  const sessions = library.filter((a) => a.type === 'session');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="chevron-left" size={22} color={colors.mint} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        {/* Screen head */}
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: `${colors.mintDim}22` }]}>
            <IconSymbol name="trophy.fill" size={26} color={colors.mintDim} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.title}>{t('academy.title')}</Text>
            <Text style={styles.subtitle}>
              {viewer ? t('academy.subtitleShared') : t('academy.subtitleOwn')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('academy.videos')}</Text>
        <View style={styles.list}>
          {videos.map((v) => (
            <AcademyRow key={v.id} item={v} onPress={() => router.push(`/academy-item?id=${v.id}`)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('academy.sessions')}</Text>
        <View style={styles.list}>
          {sessions.map((s) => (
            <AcademyRow key={s.id} item={s} onPress={() => router.push(`/academy-item?id=${s.id}`)} />
          ))}
        </View>

        {viewer ? null : (
          <Pressable style={styles.action} onPress={() => router.push('/academy-create')}>
            <IconSymbol name="plus" size={18} color={colors.textOnPrimary} />
            <Text style={styles.actionText}>{t('academy.addMaterial')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  list: {
    gap: Spacing.md,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 6,
  },
  duration: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.text,
  },
  sharedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sharedText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.mintDim,
  },
  privateText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
