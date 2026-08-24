import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
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
import { ROLE_LABELS, useSession } from '@/lib/session';

type ListScreenProps<T> = {
  icon: IconSymbolName;
  accent: string;
  title: string;
  subtitle: string;
  /** Show a back button instead of the brand header (for pushed feature screens). */
  back?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (item: T) => string;
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** When provided, the action button toggles an inline form rendered above the list. */
  actionForm?: (close: () => void) => ReactNode;
  emptyText?: string;
};

export function ListScreen<T>({
  icon,
  accent,
  title,
  subtitle,
  back,
  searchable,
  searchPlaceholder,
  searchKeys,
  items,
  itemKey,
  renderItem,
  actionLabel,
  onAction,
  actionForm,
  emptyText = 'No results found.',
}: ListScreenProps<T>) {
  const router = useRouter();
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(10));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchKeys) return items;
    const q = query.toLowerCase();
    return items.filter((it) => searchKeys(it).toLowerCase().includes(q));
  }, [query, items, searchKeys]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <Animated.View
        style={[styles.flex, { opacity: fade, transform: [{ translateY: rise }] }]}
      >
        {/* Brand header or back button */}
        {back ? (
          <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
            <IconSymbol name="chevron-left" size={22} color={Colors.mint} />
            <Text style={styles.backText}>back</Text>
          </Pressable>
        ) : (
          <View style={styles.header}>
            <View style={styles.brand}>
              <Image
                source={require('@/assets/images/goalhub-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandText}>goalhub</Text>
            </View>
            {user ? (
              <View style={[styles.rolePill, { borderColor: `${user.color}55` }]}>
                <View style={[styles.roleDot, { backgroundColor: user.color }]} />
                <Text style={styles.rolePillText}>{ROLE_LABELS[user.role]}</Text>
              </View>
            ) : null}
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Screen head */}
          <View style={styles.head}>
            <View style={[styles.headIcon, { backgroundColor: `${accent}22` }]}>
              <IconSymbol name={icon} size={26} color={accent} />
            </View>
            <View style={styles.headBody}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          {searchable ? (
            <View style={styles.search}>
              <IconSymbol name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder ?? 'Search…'}
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <IconSymbol name="xmark" size={16} color={Colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {actionForm && showForm ? (
            <View style={styles.formWrap}>{actionForm(() => setShowForm(false))}</View>
          ) : null}

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <IconSymbol name="search" size={26} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <Fragment key={itemKey(item)}>{renderItem(item)}</Fragment>
              ))}
            </View>
          )}

          {actionLabel ? (
            <Pressable
              style={styles.action}
              onPress={() => (actionForm ? setShowForm((s) => !s) : onAction?.())}>
              <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={Colors.textOnPrimary} />
              <Text style={styles.actionText}>{showForm ? 'close form' : actionLabel}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  backText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.mint,
    textTransform: 'lowercase',
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
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.mint,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
    paddingVertical: Spacing.md,
  },
  formWrap: {
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
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
  },
});
