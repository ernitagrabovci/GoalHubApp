import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconTile, ListRow } from '@/components/list-row';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_ACADEMY, type AcademyItem } from '@/lib/data';
import { useSession } from '@/lib/session';

function AcademyRow({ item, onPress }: { item: AcademyItem; onPress: () => void }) {
  const icon: IconSymbolName = item.type === 'video' ? 'play.fill' : 'calendar';
  return (
    <ListRow
      title={item.title}
      subtitle={`${item.category} · ${item.level}`}
      leading={<IconTile icon={icon} color={item.color} />}
      onPress={onPress}
      trailing={
        <View style={styles.trailing}>
          <Text style={styles.duration}>{item.duration}</Text>
          {item.isShared ? (
            <View style={styles.sharedTag}>
              <IconSymbol name="link" size={10} color={Colors.mintDim} />
              <Text style={styles.sharedText}>shared</Text>
            </View>
          ) : (
            <Text style={styles.privateText}>private</Text>
          )}
        </View>
      }
    />
  );
}

export default function AcademyScreen() {
  const router = useRouter();
  const { user } = useSession();
  const viewer = user?.role === 'player' || user?.role === 'parent';
  const library = viewer ? ALL_ACADEMY.filter((a) => a.isShared) : ALL_ACADEMY;
  const videos = library.filter((a) => a.type === 'video');
  const sessions = library.filter((a) => a.type === 'session');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>goalhub</Text>
          </View>
        </View>

        {/* Screen head */}
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: `${Colors.mintDim}22` }]}>
            <IconSymbol name="trophy.fill" size={26} color={Colors.mintDim} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.title}>academy</Text>
            <Text style={styles.subtitle}>
              {viewer ? 'shared videos & session plans' : 'training videos & session plans'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>videos</Text>
        <View style={styles.list}>
          {videos.map((v) => (
            <AcademyRow key={v.id} item={v} onPress={() => router.push(`/academy-item?id=${v.id}`)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>sessions</Text>
        <View style={styles.list}>
          {sessions.map((s) => (
            <AcademyRow key={s.id} item={s} onPress={() => router.push(`/academy-item?id=${s.id}`)} />
          ))}
        </View>

        {viewer ? null : (
          <Pressable style={styles.action} onPress={() => router.push('/academy-create')}>
            <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
            <Text style={styles.actionText}>add training material</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
    color: Colors.mint,
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
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
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
    color: Colors.text,
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
    color: Colors.mintDim,
  },
  privateText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
