import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useSession, type Role } from '@/lib/session';

type Mode = 'signin' | 'signup';

const ROLE_OPTIONS: { role: Role; icon: IconSymbolName; label: string; color: string }[] = [
  { role: 'administrator', icon: 'verified-user', label: 'admin', color: '#1a9e5c' },
  { role: 'trainer', icon: 'figure.soccer', label: 'trainer', color: '#2fbf71' },
  { role: 'player', icon: 'person.fill', label: 'player', color: '#f5a623' },
  { role: 'parent', icon: 'person.2.fill', label: 'parent', color: '#8f86e8' },
  { role: 'financier', icon: 'dollarsign.circle.fill', label: 'finance', color: '#5aa7e6' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('administrator');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@fcprishtina.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(
      {
        administrator: 'admin@fcprishtina.com',
        trainer: 'rexhep@fcprishtina.com',
        player: 'ardit@fcprishtina.com',
        parent: 'besnik@gmail.com',
        financier: 'faton@fcprishtina.com',
      }[r]
    );
  };

  const submit = () => {
    signIn(role);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.wordmark}>goalhub</Text>
          </View>

          <Text style={styles.heroTitle}>
            {mode === 'signin' ? t('login.welcomeBack') : t('login.joinClub')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {mode === 'signin' ? t('login.signInSub') : t('login.signUpSub')}
          </Text>

          {/* Mode switch */}
          <View style={styles.segment}>
            <ModeTab active={mode === 'signin'} label={t('login.signIn')} onPress={() => setMode('signin')} />
            <ModeTab active={mode === 'signup'} label={t('login.createAccount')} onPress={() => setMode('signup')} />
          </View>

          <View style={styles.card}>
            {mode === 'signup' && (
              <Field
                id="name"
                icon="person.fill"
                placeholder={t('login.fullName')}
                value={name}
                onChangeText={setName}
                focused={focused}
                onFocus={setFocused}
              />
            )}

            <Field
              id="email"
              icon="mail"
              placeholder={t('login.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              focused={focused}
              onFocus={setFocused}
            />

            <Field
              id="password"
              icon="lock"
              placeholder={t('login.password')}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              focused={focused}
              onFocus={setFocused}
              trailing={
                <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={12}>
                  <IconSymbol
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </Pressable>
              }
            />

            {mode === 'signin' && (
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.textMuted} />
                  <Text style={styles.hint}>{t('login.rememberMe')}</Text>
                </View>
                <Text style={styles.link}>{t('login.forgotPassword')}</Text>
              </View>
            )}

            {/* Demo role selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>{t('login.chooseRole')}</Text>
              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((opt) => {
                  const active = role === opt.role;
                  return (
                    <Pressable
                      key={opt.role}
                      onPress={() => pickRole(opt.role)}
                      style={[
                        styles.roleChip,
                        active && { borderColor: opt.color, backgroundColor: Colors.surfaceAlt },
                      ]}
                    >
                      <View style={[styles.roleIcon, { backgroundColor: `${opt.color}22` }]}>
                        <IconSymbol name={opt.icon} size={16} color={opt.color} />
                      </View>
                      <Text style={[styles.roleText, active && { color: Colors.text }]}>
                        {t(`role.${opt.role}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable style={[styles.primary, { backgroundColor: role ? ROLE_OPTIONS.find((o) => o.role === role)!.color : Colors.mint }]} onPress={submit}>
              <Text style={styles.primaryText}>
                {mode === 'signin' ? t('login.signIn') : t('login.createAccount')}
              </Text>
              <IconSymbol name="arrow.right" size={20} color={Colors.textOnPrimary} />
            </Pressable>

            <Text style={styles.footerNote}>
              {t('login.footer')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.modeTab, active && styles.modeTabActive]} onPress={onPress}>
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  id,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  focused,
  onFocus,
  trailing,
}: {
  id: string;
  icon: IconSymbolName;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address';
  autoCapitalize?: 'none' | 'words';
  focused: string | null;
  onFocus: (id: string | null) => void;
  trailing?: React.ReactNode;
}) {
  const isFocused = focused === id;
  return (
    <View style={[styles.field, isFocused && styles.fieldFocused]}>
      <IconSymbol name={icon} size={20} color={isFocused ? Colors.mint : Colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => onFocus(id)}
        onBlur={() => onFocus(null)}
      />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(64, 138, 113, 0.10)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(176, 228, 204, 0.06)',
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 44,
    height: 44,
  },
  wordmark: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: Colors.mint,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: Fonts.heading,
    color: Colors.text,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  heroSubtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
  },
  segment: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  modeTabActive: {
    backgroundColor: Colors.emerald,
  },
  modeTabText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textMuted,
    textTransform: 'lowercase',
  },
  modeTabTextActive: {
    color: Colors.textOnPrimary,
  },
  card: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  fieldFocused: {
    borderColor: Colors.mint,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.body,
    padding: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  link: {
    color: Colors.mint,
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  roleSection: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  roleLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  roleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  primary: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  primaryText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  footerNote: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.body,
    marginTop: Spacing.xs,
  },
});
