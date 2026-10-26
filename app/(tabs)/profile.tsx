import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

const C = {
  text: '#111111',
  gray: '#666666',
  muted: '#8A8A8A',

  white: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#D9DEDB',
  divider: '#E7EEE9',

  green: '#159447',
  greenDeep: '#14734F',
  greenDark: '#0C6C36',
  lightGreen: '#DDF6E7',
  veryLightGreen: '#F1FBF5',

  red: '#E03131',
  redDark: '#9E1B1B',
  redSoft: 'rgba(224,49,49,0.08)',

  amber: '#C97F0D',
};

/** Health status → the child card's status pill. */
const STATUS_TONE: Record<string, string> = {
  active: C.green,
  injured: C.red,
  rehabilitation: C.amber,
  suspended: C.redDark,
};

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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const { t } = useLanguage();
  const [children, setChildren] = useState<ApiChild[] | null>(null);
  const [childrenError, setChildrenError] = useState(false);

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
  }, [token, isParent, router, signOut]);

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
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
          {/* Identity — the signed-in user's card, in the dashboard's green. */}
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
                <View style={[styles.card, styles.emptyCard]}>
                  <Text style={styles.emptyText}>{t('profile.childrenError')}</Text>
                </View>
              ) : children === null ? (
                <View style={[styles.card, styles.emptyCard]}>
                  <Text style={styles.emptyText}>…</Text>
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
                                { backgroundColor: STATUS_TONE[child.health_status] ?? C.green },
                              ]}
                            >
                              <Text style={styles.statusText}>
                                {statusLabel(child.health_status)}
                              </Text>
                            </View>
                          </View>

                          <IconSymbol name="chevron.right" size={18} color={C.muted} />
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
            <SettingRow
              icon="person.fill"
              label={t('profile.accountSettings')}
              onPress={() => router.push('/account-settings')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock"
              label={t('profile.security')}
              onPress={() => router.push('/security-settings')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="notifications"
              label={t('profile.notifications')}
              onPress={() => router.push('/notification-settings')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="verified-user"
              label={t('profile.subscription')}
              onPress={() => router.push('/subscription-settings')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="gearshape.fill"
              label={t('profile.appSettings')}
              onPress={() => router.push('/settings')}
            />
          </View>

          {/* Sign out */}
          <Pressable
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
            onPress={handleSignOut}
          >
            <IconSymbol name="logout" size={18} color={C.red} />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </Pressable>
          <Text style={styles.footnote}>{t('profile.footnote')}</Text>
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
  onPress,
}: {
  icon: IconSymbolName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.rowIcon}>
        <IconSymbol name={icon} size={18} color={C.green} />
      </View>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <IconSymbol name="chevron.right" size={16} color={C.muted} />
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

const styles = StyleSheet.create(
  scaled({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 27,
      paddingTop: 2,
      paddingBottom: 4,
    },
    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 24,
      lineHeight: 28,
      letterSpacing: -0.5,
      color: C.text,
    },
    content: {
      paddingHorizontal: 27,
      paddingBottom: 46,
    },

    /* ── Identity card ───────────────────────────────────────── */
    hero: {
      position: 'relative',
      marginTop: 8,
      padding: 16,
      backgroundColor: C.greenDeep,
      borderRadius: 16,
      overflow: 'hidden',
    },
    heroDeco: {
      position: 'absolute',
      right: -8,
      bottom: -34,
      fontFamily: Fonts.bodyBlack,
      fontSize: 132,
      lineHeight: 140,
      letterSpacing: -8,
      color: 'rgba(190,235,215,0.14)',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      zIndex: 2,
    },
    heroAvatar: {
      width: 64,
      height: 64,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(245,245,245,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(245,245,245,0.35)',
    },
    heroInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      color: C.white,
    },
    heroBody: {
      flex: 1,
      gap: 2,
    },
    heroName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 21,
      lineHeight: 25,
      letterSpacing: -0.4,
      color: C.white,
    },
    heroMeta: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: 'rgba(245,245,245,0.72)',
    },
    rolePill: {
      marginTop: 4,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.lightGreen,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    roleDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.greenDark,
    },
    rolePillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: C.greenDark,
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
      color: C.green,
    },
    card: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    emptyCard: {
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 17,
      color: C.muted,
    },

    /* ── Setting rows ────────────────────────────────────────── */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      minHeight: 56,
      paddingVertical: 9,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.veryLightGreen,
    },
    rowLabel: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14.5,
      lineHeight: 19,
      color: C.text,
    },
    divider: {
      height: 1,
      backgroundColor: C.divider,
      marginLeft: 45,
    },

    /* ── Child cards ─────────────────────────────────────────── */
    childrenList: {
      gap: 10,
    },
    childCard: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
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
      backgroundColor: C.veryLightGreen,
      borderWidth: 1,
      borderColor: C.lightGreen,
    },
    childInitials: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      color: C.greenDark,
    },
    childBody: {
      flex: 1,
      gap: 1,
    },
    childName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15.5,
      lineHeight: 20,
      color: C.text,
    },
    childMeta: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.muted,
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
      color: C.white,
    },
    childStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    childStat: {
      flex: 1,
      alignItems: 'center',
    },
    childStatValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },
    childStatLabel: {
      marginTop: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.muted,
    },
    statDivider: {
      width: 1,
      height: 26,
      backgroundColor: C.divider,
    },

    /* ── Sign out ────────────────────────────────────────────── */
    signOut: {
      marginTop: 22,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: C.redSoft,
      borderWidth: 1,
      borderColor: 'rgba(224,49,49,0.35)',
      borderRadius: 12,
    },
    signOutText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.red,
    },
    footnote: {
      marginTop: 12,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.muted,
      textAlign: 'center',
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
      color: C.text,
      textTransform: 'lowercase',
    },
    signedOutSub: {
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 19,
      color: C.muted,
      textAlign: 'center',
    },
    primary: {
      marginTop: 14,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: C.greenDark,
      borderRadius: 10,
    },
    primaryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15,
      color: C.white,
    },

    pressed: {
      opacity: 0.6,
    },
  })
);
