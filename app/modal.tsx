import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ROLE_LABELS, useSession } from '@/lib/session';

const VERSION = '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          settings
        </ThemedText>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.closeButton}>
          <IconSymbol name="xmark" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>

      {!user ? (
        <View style={styles.signedOut}>
          <ThemedText type="subtitle">you&apos;re signed out</ThemedText>
          <ThemedText type="muted" style={styles.centerText}>
            Sign in to manage your account.
          </ThemedText>
          <Pressable style={styles.primary} onPress={() => router.replace('/login')}>
            <ThemedText type="defaultSemiBold" style={styles.primaryText}>
              go to sign in
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: `${user.color}26` }]}>
              <Text style={[styles.avatarText, { color: user.color }]}>{user.initials}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <View style={[styles.roleBadge, { borderColor: `${user.color}55` }]}>
              <View style={[styles.roleDot, { backgroundColor: user.color }]} />
              <Text style={[styles.roleBadgeText, { color: user.color }]}>
                {ROLE_LABELS[user.role]}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {user.subtitle} · {user.club}
            </Text>
          </View>

          {/* Account */}
          <Text style={styles.sectionLabel}>account</Text>
          <View style={styles.card}>
            <SettingRow
              icon="mail"
              label="email"
              value={user.email}
            />
            <View style={styles.divider} />
            <SettingRow icon="person.fill" label="role" value={ROLE_LABELS[user.role]} />
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>about</Text>
          <View style={styles.card}>
            <SettingRow icon="info" label="app" value="goalhub" />
            <View style={styles.divider} />
            <SettingRow icon="doc.text.fill" label="version" value={VERSION} />
            <View style={styles.divider} />
            <SettingRow icon="gearshape.fill" label="theme" value="dark mint" />
          </View>

          {/* Sign out */}
          <Pressable style={styles.signOut} onPress={handleSignOut}>
            <IconSymbol name="logout" size={18} color={Colors.danger} />
            <Text style={styles.signOutText}>sign out &amp; switch role</Text>
          </Pressable>
          <ThemedText type="muted" style={styles.footnote}>
            demo preview · no data leaves this device
          </ThemedText>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, value }: { icon: IconSymbolName; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <IconSymbol name={icon} size={18} color={Colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 26,
    textTransform: 'lowercase',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profile: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 28,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.mint,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.emerald,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSoft,
  },
  signOut: {
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.danger}1a`,
    borderColor: `${Colors.danger}55`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  signOutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.danger,
  },
  footnote: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  signedOut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xxl,
  },
  centerText: {
    textAlign: 'center',
  },
  primary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryText: {
    color: Colors.textOnPrimary,
  },
});
