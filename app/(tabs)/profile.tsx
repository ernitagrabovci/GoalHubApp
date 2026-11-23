import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { listMyChildren } from '@/lib/api/children';
import { ApiError } from '@/lib/api/errors';
import type { ApiChild } from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { statusLabel } from '@/lib/player-status';
import { useLanguage } from '@/lib/i18n';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

const C_LIGHT = {
  glassRim: 'rgba(255,255,255,0.85)',
  text: '#17251E',
  gray: '#666666',
  muted: '#52645A',

  white: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#D9DEDB',
  divider: '#E7EEE9',

  green: '#2E7D5B',
  greenDeep: '#14734F',
  greenDark: '#0C6C36',
  greenLine: '#69C994',
  lightGreen: '#DDF6E7',
  veryLightGreen: '#F1FBF5',

  red: '#B91C1C',
  redDark: '#9E1B1B',
  redSoft: 'rgba(224,49,49,0.08)',

  amber: '#C97F0D',
};

/** Health status → the child card's status pill. */
const STATUS_TONE = (C: AppColorsOf<typeof C_LIGHT>): Record<string, string> => ({
  active: C.green,
  injured: C.red,
  rehabilitation: C.amber,
  suspended: C.redDark,
});

/** First letters of a name, capped at two, for the child tile. */
function initials(name: string | null): string {
  return (
    (name ?? '')
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '—'
  );
}

/** Settings rows — each gets its own pastel chip, like the dashboard menu cards. */
const SETTINGS = (C: AppColorsOf<typeof C_LIGHT>): {
  icon: IconSymbolName;
  labelKey: string;
  captionKey: string;
  chip: string;
  tint: string;
  route: Href;
}[] => ([
  {
    icon: 'person.fill',
    labelKey: 'profile.accountSettings',
    captionKey: 'profile.accountCaption',
    chip: '#E8F3FF',
    tint: '#3D82D8',
    route: '/account-settings',
  },
  {
    icon: 'lock',
    labelKey: 'profile.security',
    captionKey: 'profile.securityCaption',
    chip: '#E9F7EF',
    tint: C.green,
    route: '/security-settings',
  },
  {
    icon: 'notifications',
    labelKey: 'profile.notifications',
    captionKey: 'profile.notificationsCaption',
    chip: '#FDF1E3',
    tint: C.amber,
    route: '/notification-settings',
  },
  {
    icon: 'verified-user',
    labelKey: 'profile.subscription',
    captionKey: 'profile.subscriptionCaption',
    chip: '#FDECF2',
    tint: '#D6455D',
    route: '/subscription-settings',
  },
  {
    icon: 'gearshape.fill',
    labelKey: 'profile.appSettings',
    captionKey: 'profile.appCaption',
    chip: '#EEEFFB',
    tint: '#5B5BD6',
    route: '/settings',
  },
]);

export default function ProfileScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const { t } = useLanguage();
  const [children, setChildren] = useState<ApiChild[] | null>(null);
  const [childrenError, setChildrenError] = useState(false);
  const [reload, setReload] = useState(0);

  const isParent = user?.role === 'parent';

  /* A parent's linked children come from their own children list. */
  useEffect(() => {
    if (!token || !isParent) return;
    const controller = new AbortController();

    listMyChildren(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setChildren(res.data);
        setChildrenError(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setChildren([]);
        setChildrenError(true);
      });

    return () => controller.abort();
  }, [token, isParent, router, signOut, reload]);

  /* Refetch from the error card; the effect cannot reset state synchronously. */
  const retryChildren = () => {
    setChildren(null);
    setChildrenError(false);
    setReload((value) => value + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
      </View>

      {!user ? (
        <View style={styles.signedOut}>
          <Text style={styles.signedOutTitle}>{t('profile.signedOutTitle')}</Text>
          <Text style={styles.signedOutSub}>{t('profile.signedOutSub')}</Text>
          <Pressable style={styles.primary} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryText}>{t('profile.goToSignIn')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Identity — soft mint card; account editing lives in the settings list. */}
          <View style={styles.hero}>
            <Text style={styles.heroDeco} numberOfLines={1}>
              {user.initials}
            </Text>

            <View style={styles.heroTop}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroInitials}>{user.initials}</Text>
              </View>

              <View style={styles.heroBody}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {user.club || user.email}
                </Text>
                <View style={styles.rolePill}>
                  <View style={styles.roleDot} />
                  <Text style={styles.rolePillText}>{t(`role.${user.role}`)}</Text>
                </View>
              </View>

            </View>
          </View>

          {/* Linked children — parent only. */}
          {isParent ? (
            <>
              <Text style={styles.sectionLabel}>{t('profile.myChildren')}</Text>

              {childrenError ? (
                <View style={[styles.card, styles.emptyCard, styles.stateCard]}>
                  <Text style={styles.emptyText}>{t('profile.childrenError')}</Text>
                  <Pressable
                    onPress={retryChildren}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.retry')}
                    style={({ pressed }) => [styles.stateRetry, pressed && styles.pressed]}
                  >
                    <Text style={styles.stateRetryText}>{t('common.retry')}</Text>
                  </Pressable>
                </View>
              ) : children === null ? (
                <View style={[styles.card, styles.emptyCard, styles.stateCardInline]}>
                  <ActivityIndicator color={C.greenText} />
                  <Text style={styles.emptyText}>{t('profile.loadingChildren')}</Text>
                </View>
              ) : children.length === 0 ? (
                <View style={[styles.card, styles.emptyCard]}>
                  <Text style={styles.emptyText}>{t('profile.noChildren')}</Text>
                </View>
              ) : (
                <View style={styles.childrenList}>
                  {children.map((child) => {
                    const rating = child.last_rating?.average;
                    const meta = [
                      child.jersey_number != null ? `Nr. ${child.jersey_number}` : null,
                      child.position ? positionLabel(child.position) : null,
                      child.team?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <Pressable
                        key={child.id}
                        onPress={() =>
                          router.push({
                            pathname: '/profili-femiut',
                            params: {
                              id: String(child.id),
                              name: child.name ?? '',
                              team: child.team?.name ?? '',
                              nr: child.jersey_number != null ? String(child.jersey_number) : '',
                              pos: child.position ? positionLabel(child.position) : '',
                            },
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={child.name ?? t('profile.linkedChild')}
                        style={({ pressed }) => [styles.childCard, pressed && styles.pressed]}
                      >
                        <View style={styles.childHead}>
                          <View style={styles.childTile}>
                            <Text style={styles.childInitials}>{initials(child.name)}</Text>
                          </View>

                          <View style={styles.childBody}>
                            <Text style={styles.childName} numberOfLines={1}>
                              {child.name ?? '—'}
                            </Text>
                            <Text style={styles.childMeta} numberOfLines={1}>
                              {meta || '—'}
                            </Text>
                            <View
                              style={[
                                styles.statusPill,
                                { backgroundColor: STATUS_TONE(C)[child.health_status] ?? C.green },
                              ]}
                            >
                              <Text style={styles.statusText}>
                                {statusLabel(child.health_status)}
                              </Text>
                            </View>
                          </View>

                          <IconSymbol name="chevron.right" size={I(17)} color={C.mutedText} />
                        </View>

                        <View style={styles.childStats}>
                          <ChildStat
                            label={t('profile.attendance')}
                            value={`${child.attendance_rate}%`}
                          />
                          <View style={styles.statDivider} />
                          <ChildStat
                            label={t('profile.openFees')}
                            value={String(child.open_fees_count)}
                            tone={child.open_fees_count > 0 ? C.amber : C.text}
                          />
                          <View style={styles.statDivider} />
                          <ChildStat
                            label={t('profile.rating')}
                            value={rating != null ? Number(rating).toFixed(1) : '—'}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : null}

          {/* Everything account-related lives on the settings sub-pages. */}
          <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>
          <View style={styles.card}>
            {SETTINGS(C).map((item, i) => (
              <View key={item.labelKey}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <SettingRow
                  icon={item.icon}
                  label={t(item.labelKey)}
                  caption={t(item.captionKey)}
                  chip={item.chip}
                  tint={item.tint}
                  onPress={() => router.push(item.route)}
                />
              </View>
            ))}
          </View>

          {/* App identity — a compact branded footer. */}
          <Text style={styles.sectionLabel}>{t('profile.about')}</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutLogo}>
              <MaterialCommunityIcons name="soccer" size={I(22)} color={C.whiteText} />
            </View>
            <View style={styles.aboutBody}>
              <Text style={styles.aboutName}>GoalHub</Text>
              <Text style={styles.aboutVersion}>
                {t('profile.version')} {Constants.expoConfig?.version ?? '—'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function SettingRow({
  icon,
  label,
  caption,
  chip,
  tint,
  onPress,
}: {
  icon: IconSymbolName;
  label: string;
  caption: string;
  chip: string;
  tint: string;
  onPress: () => void;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, { backgroundColor: chip }]}>
        <IconSymbol name={icon} size={I(18)} color={tint} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.rowCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>

      <IconSymbol name="chevron.right" size={I(16)} color={C.mutedText} />
    </Pressable>
  );
}

function ChildStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={styles.childStat}>
      <Text style={[styles.childStatValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.childStatLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
  scaled({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 27,
      paddingTop: 4,
    },
    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 31,
      letterSpacing: -0.6,
      color: C.textText,
    },
    subtitle: {
      marginTop: 2,
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 17,
      color: C.mutedText,
    },
    content: {
      paddingHorizontal: 27,
      paddingTop: 14,
      paddingBottom: 46,
    },

    /* ── Identity card ───────────────────────────────────────── */
    hero: {
      position: 'relative',
      padding: 16,
      backgroundColor: C.veryLightGreenFill,
      borderWidth: 1,
      borderColor: C.greenLineBorder,
      borderRadius: 16,
      overflow: 'hidden',
    },
    heroDeco: {
      position: 'absolute',
      right: -14,
      bottom: -52,
      fontFamily: Fonts.bodyBlack,
      fontSize: 132,
      lineHeight: 140,
      letterSpacing: -8,
      color: 'rgba(21,148,71,0.08)',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      zIndex: 2,
    },
    heroAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.greenFill,
      borderWidth: 3,
      borderColor: C.glassRimBorder,
    },
    heroInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 21,
      color: C.whiteText,
    },
    heroBody: {
      flex: 1,
      gap: 2,
    },
    heroName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: C.textText,
    },
    heroMeta: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.grayText,
    },
    rolePill: {
      marginTop: 4,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.lightGreenFill,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    roleDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.greenFill,
    },
    rolePillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: C.greenDarkText,
    },

    /* ── Sections ────────────────────────────────────────────── */
    sectionLabel: {
      marginTop: 22,
      marginBottom: 8,
      marginLeft: 2,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: C.greenText,
    },
    card: {
      backgroundColor: C.cardFill,
      borderWidth: 1,
      borderColor: C.cardBorderBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      overflow: 'hidden',
    },
    emptyCard: {
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    stateCard: {
      gap: 10,
    },
    stateCardInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stateRetry: {
      minHeight: 44,
      alignSelf: 'flex-start',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 10,
    },
    stateRetryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.greenText,
    },
    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 17,
      color: C.mutedText,
    },

    /* ── Setting rows ────────────────────────────────────────── */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 62,
      paddingVertical: 9,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      gap: 1,
    },
    rowLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14.5,
      lineHeight: 19,
      color: C.textText,
    },
    rowCaption: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.mutedText,
    },
    divider: {
      height: 1,
      backgroundColor: C.dividerFill,
      marginLeft: 50,
    },

    /* ── About ───────────────────────────────────────────────── */
    aboutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.cardFill,
      borderWidth: 1,
      borderColor: C.cardBorderBorder,
      borderRadius: 14,
      padding: 14,
    },
    aboutLogo: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.greenDeepFill,
    },
    aboutBody: {
      flex: 1,
    },
    aboutName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15.5,
      lineHeight: 20,
      color: C.textText,
    },
    aboutVersion: {
      marginTop: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.mutedText,
    },

    /* ── Child cards ─────────────────────────────────────────── */
    childrenList: {
      gap: 10,
    },
    childCard: {
      backgroundColor: C.cardFill,
      borderWidth: 1,
      borderColor: C.cardBorderBorder,
      borderRadius: 14,
      padding: 14,
    },
    childHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    childTile: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.veryLightGreenFill,
      borderWidth: 1,
      borderColor: C.lightGreenBorder,
    },
    childInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      color: C.greenDarkText,
    },
    childBody: {
      flex: 1,
      gap: 1,
    },
    childName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15.5,
      lineHeight: 20,
      color: C.textText,
    },
    childMeta: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.mutedText,
    },
    statusPill: {
      marginTop: 3,
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    statusText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      letterSpacing: 0.3,
      color: C.whiteText,
    },
    childStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.dividerBorder,
    },
    childStat: {
      flex: 1,
      alignItems: 'center',
    },
    childStatValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.textText,
    },
    childStatLabel: {
      marginTop: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.mutedText,
    },
    statDivider: {
      width: 1,
      height: 26,
      backgroundColor: C.dividerFill,
    },

    /* ── Signed out ──────────────────────────────────────────── */
    signedOut: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 32,
    },
    signedOutTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 27,
      color: C.textText,
      textTransform: 'lowercase',
    },
    signedOutSub: {
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 19,
      color: C.mutedText,
      textAlign: 'center',
    },
    primary: {
      marginTop: 14,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: C.greenDarkFill,
      borderRadius: 10,
    },
    primaryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15,
      color: C.whiteText,
    },

    pressed: {
      opacity: 0.6,
    },
  })
);
