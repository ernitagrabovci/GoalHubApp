import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export function ComingSoon({
  icon,
  accent,
  title,
  description,
}: {
  icon: IconSymbolName;
  accent: string;
  title: string;
  description: string;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/goalhub-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>goalhub</Text>
      </View>
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}1f`, borderColor: `${accent}40` }]}>
          <IconSymbol name={icon} size={34} color={accent} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.mint,
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
