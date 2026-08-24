import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <IconSymbol name="hammer.fill" size={34} color={Colors.mint} />
        </View>
        <ThemedText type="title" style={styles.title}>
          coming soon
        </ThemedText>
        <ThemedText type="muted" style={styles.description}>
          This section is on its way. Check back after the next update.
        </ThemedText>
        <Link href="/" dismissTo asChild>
          <Pressable style={styles.closeButton}>
            <IconSymbol name="xmark" size={18} color={Colors.textOnPrimary} />
            <ThemedText type="defaultSemiBold" style={styles.closeText}>
              Close
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.md,
    maxWidth: 320,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textTransform: 'lowercase',
  },
  description: {
    textAlign: 'center',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  closeText: {
    color: Colors.textOnPrimary,
  },
});
