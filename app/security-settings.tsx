import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { DeleteAccountModal } from '@/components/settings/delete-account-modal';
import { Fonts } from '@/constants/theme';
import { deactivateAccount } from '@/lib/api/account';
import { ApiError } from '@/lib/api/errors';
import {
  confirmTwoFactor,
  disableTwoFactor,
  getSecuritySessions,
  getTwoFactorStatus,
  setupTwoFactor,
} from '@/lib/api/security';
import type {
  SecuritySessionsResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession, type Role } from '@/lib/session';

/**
 * Siguria — the fifth settings sub-page.
 *
 * Same light #FAFBFA canvas as the other sub-pages. Five stacked sections:
 * the security score card, the current session details, the (empty) login
 * history, the quick actions list and the danger zone banner.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  frame: '#000000',
  white: '#F5F5F5',

  card: '#F6FBFF',
  cardBorder: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(100,140,190,0.25)',

  ok: '#08A600',
  warn: '#E08700',
  track: '#E4E7E9',
  blue: '#1B6FBF',

  badgeBg: '#E7EEF4',
  emptyBorder: '#D5E0E9',

  red: '#E03131',
  dangerBg: '#FDF3F3',
  dangerBorder: 'rgba(224,49,49,0.35)',
};

/** The app's role union → the Albanian label shown in the session table. */
const ROLE_NAME: Record<Role, string> = {
  administrator: 'Administrator',
  trainer: 'Trajner',
  player: 'Lojtar',
  parent: 'Prind',
  financier: 'Financier',
};

/** `2026-10-14T08:30:00Z` → `14/10/2026 08:30`; absent or unparseable → `—`. */
function when(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

function panelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Shumë tentativa. Provo përsëri pas një minute.';
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

const QUICK_ACTIONS: { label: string; color: string; route?: string }[] = [
  { label: 'Ndrysho fjalëkalimin', color: C.ok, route: '/account-settings' },
  { label: 'Ndrysho email adresën', color: C.blue, route: '/account-settings' },
  { label: 'Menaxho lojtarët', color: C.text, route: '/players' },
  { label: 'Menaxho përdoruesit', color: C.text, route: '/perdoruesit' },
];

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardHeadText}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function StatusRow({
  tone,
  title,
  desc,
  actionLabel,
  onAction,
  last,
}: {
  tone: string;
  title: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.rowAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.kvRow, last && styles.rowLast]}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  label,
  color,
  onPress,
  last,
}: {
  label: string;
  color: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionRow,
        last && styles.rowLast,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={I(20)} color={C.gray} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { token, user, signOut } = useSession();

  const [dangerBusy, setDangerBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [sessions, setSessions] = useState<SecuritySessionsResponse | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'enable' | 'disable' | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [panelBusy, setPanelBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    getSecuritySessions(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSessions(res);
        setSessionsError(null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSessionsError(
          e instanceof ApiError && e.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohet historia e hyrjeve.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    getTwoFactorStatus(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTwoFactor(res);
        setTwoFactorError(null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setTwoFactorError('Nuk mund të lexohet statusi i 2FA.');
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  /* The score counts the four fixed controls plus an enabled 2FA. */
  const score: number = twoFactor?.enabled ? 4 : 3;

  const alertError = (e: unknown) =>
    Alert.alert(
      'Veprimi dështoi',
      e instanceof ApiError && e.status !== 0 && e.message
        ? e.message
        : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
    );

  const resetPanel = () => {
    setPanel(null);
    setSetupData(null);
    setRecoveryCodes(null);
    setCode('');
    setPassword('');
    setPanelError(null);
    setPanelBusy(false);
  };

  const startEnable = async () => {
    if (!token || panelBusy) return;

    resetPanel();
    setPanel('enable');
    setPanelBusy(true);

    try {
      const data = await setupTwoFactor(token);
      setSetupData(data);
    } catch (e) {
      setPanel(null);
      alertError(e);
    } finally {
      setPanelBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!token || panelBusy) return;

    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setPanelError('Shkruaj kodin 6-shifror.');
      return;
    }

    setPanelBusy(true);
    setPanelError(null);
    try {
      const res = await confirmTwoFactor(token, trimmed);
      setRecoveryCodes(res.recovery_codes);
      setCode('');
      setTwoFactor({
        enabled: true,
        confirmed_at: new Date().toISOString(),
        recovery_codes_remaining: res.recovery_codes.length,
      });
    } catch (e) {
      setPanelError(panelErrorMessage(e));
    } finally {
      setPanelBusy(false);
    }
  };

  const submitDisable = async () => {
    if (!token || panelBusy) return;

    if (!password) {
      setPanelError('Shkruaj fjalëkalimin.');
      return;
    }
    if (!code.trim()) {
      setPanelError('Shkruaj kodin e autentikimit.');
      return;
    }

    setPanelBusy(true);
    setPanelError(null);
    try {
      await disableTwoFactor(token, password, code.trim());
      setTwoFactor({ enabled: false, confirmed_at: null, recovery_codes_remaining: 0 });
      resetPanel();
    } catch (e) {
      setPanelError(panelErrorMessage(e));
    } finally {
      setPanelBusy(false);
    }
  };

  /* Deactivating is reversible: it flips the flag, then the session ends. */
  const onDeactivate = () => {
    if (!token || dangerBusy) return;
    Alert.alert(
      'Çaktivizo llogarinë',
      'Llogaria do të çaktivizohet dhe do të dilni. Mund ta riaktivizoni më vonë.',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Çaktivizo',
          style: 'destructive',
          onPress: () => {
            setDangerBusy(true);
            deactivateAccount(token)
              .then(() => {
                signOut();
                router.replace('/login');
              })
              .catch((e) => {
                setDangerBusy(false);
                alertError(e);
              });
          },
        },
      ],
    );
  };

  const current = sessions?.current;
  const sessionRows = [
    { label: 'Roli', value: user ? ROLE_NAME[user.role] : '—' },
    { label: 'Emaili', value: user?.email ?? '—' },
    { label: 'Hyrja e fundit', value: when(sessions?.last_login_at) },
    { label: 'IP adresa', value: current?.ip_address ?? '—' },
    { label: 'Browser', value: current?.user_agent ?? '—' },
  ];

  const loginRows = sessions?.sessions ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Pinned header */}
        <View style={styles.header}>
          <View style={styles.colPad}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Kthehu prapa"
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title}>Siguria</Text>
                <Text style={styles.subtitle}>Kontrolli i aksesit dhe veprimeve të sigurisë</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.colPad}>
            {/* ── Niveli i sigurisë ────────────────────────────── */}
            <Card title="Niveli i sigurisë">
              <View style={styles.scoreWrap}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Niveli i sigurisë</Text>
                  <Text style={styles.scoreValue}>
                    {score}/4 {score === 4 ? 'Shkëlqyeshëm' : 'Mirë'}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${score * 25}%` }]} />
                </View>
              </View>

              <View style={styles.scoreDivider} />

              <View style={styles.rows}>
                <StatusRow
                  tone={C.ok}
                  title="Fjalëkalim i fuqishëm"
                  desc="Fjalëkalimi juaj i plotëson kërkesat"
                />
                <StatusRow
                  tone={C.ok}
                  title="Email i konfirmuar"
                  desc={user?.email ?? '—'}
                />
                <StatusRow
                  tone={twoFactor?.enabled ? C.ok : C.warn}
                  title="Hyrje e dyfishtë (2FA)"
                  desc={
                    twoFactor
                      ? twoFactor.enabled
                        ? `Aktiv · ${twoFactor.recovery_codes_remaining} kode rikuperimi`
                        : 'Jo aktiv'
                      : twoFactorError ?? 'Duke u ngarkuar…'
                  }
                  actionLabel={
                    twoFactor ? (twoFactor.enabled ? 'Çaktivizo' : 'Aktivizo') : undefined
                  }
                  onAction={
                    twoFactor
                      ? twoFactor.enabled
                        ? () => {
                            resetPanel();
                            setPanel('disable');
                          }
                        : startEnable
                      : undefined
                  }
                />
                <StatusRow
                  tone={C.ok}
                  title="Sesion i sigurt (HTTPS)"
                  desc="Aktiv"
                  last
                />
              </View>

              {panel === 'enable' ? (
                <View style={styles.panel}>
                  {recoveryCodes ? (
                    <>
                      <Text style={styles.panelTitle}>2FA u aktivizua</Text>
                      <Text style={styles.panelHint}>
                        Ruaj këto kode rikuperimi — shfaqen vetëm një herë.
                      </Text>
                      <View style={styles.codes}>
                        {recoveryCodes.map((recoveryCode) => (
                          <Text key={recoveryCode} style={styles.codeLine} selectable>
                            {recoveryCode}
                          </Text>
                        ))}
                      </View>
                      <Pressable
                        onPress={resetPanel}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.panelPrimary,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.panelPrimaryText}>Kuptova</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.panelTitle}>Aktivizo 2FA</Text>
                      <Text style={styles.panelHint}>
                        Shto çelësin te aplikacioni i autentikimit, pastaj shkruaj kodin
                        që shfaqet.
                      </Text>

                      {setupData ? (
                        <>
                          <Text style={styles.secret} selectable>
                            {setupData.secret}
                          </Text>
                          <Text style={styles.link} selectable numberOfLines={2}>
                            {setupData.otpauth_url}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.panelHint}>
                          {panelBusy ? 'Duke përgatitur…' : 'Nuk u ngarkua çelësi.'}
                        </Text>
                      )}

                      <TextInput
                        style={styles.panelField}
                        placeholder="000000"
                        placeholderTextColor={C.gray}
                        value={code}
                        onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!panelBusy}
                        textContentType="oneTimeCode"
                        accessibilityLabel="Kodi 6-shifror"
                      />

                      {panelError ? (
                        <Text style={styles.panelError} accessibilityRole="alert">
                          {panelError}
                        </Text>
                      ) : null}

                      <View style={styles.panelBtns}>
                        <Pressable
                          onPress={resetPanel}
                          disabled={panelBusy}
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.panelGhost,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.panelGhostText}>Anulo</Text>
                        </Pressable>
                        <Pressable
                          onPress={confirmEnable}
                          disabled={panelBusy || !setupData}
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.panelPrimary,
                            (pressed || panelBusy || !setupData) && styles.off,
                          ]}
                        >
                          {panelBusy ? (
                            <ActivityIndicator color={C.text} size="small" />
                          ) : (
                            <Text style={styles.panelPrimaryText}>Konfirmo</Text>
                          )}
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ) : null}

              {panel === 'disable' ? (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Çaktivizo 2FA</Text>
                  <Text style={styles.panelHint}>
                    Fjalëkalimi dhe kodi i autentikimit kërkohen për ta çaktivizuar.
                  </Text>

                  <TextInput
                    style={styles.panelField}
                    placeholder="Fjalëkalimi"
                    placeholderTextColor={C.gray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!panelBusy}
                    accessibilityLabel="Fjalëkalimi"
                  />
                  <TextInput
                    style={styles.panelField}
                    placeholder="Kodi 6-shifror ose kod rikuperimi"
                    placeholderTextColor={C.gray}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={20}
                    editable={!panelBusy}
                    accessibilityLabel="Kodi i autentikimit"
                  />

                  {panelError ? (
                    <Text style={styles.panelError} accessibilityRole="alert">
                      {panelError}
                    </Text>
                  ) : null}

                  <View style={styles.panelBtns}>
                    <Pressable
                      onPress={resetPanel}
                      disabled={panelBusy}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.panelGhost,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.panelGhostText}>Anulo</Text>
                    </Pressable>
                    <Pressable
                      onPress={submitDisable}
                      disabled={panelBusy}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.panelSolid,
                        (pressed || panelBusy) && styles.off,
                      ]}
                    >
                      {panelBusy ? (
                        <ActivityIndicator color={C.white} size="small" />
                      ) : (
                        <Text style={styles.panelSolidText}>Çaktivizo</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </Card>

            {/* ── Sesioni aktual ───────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Sesioni aktual</Text>
              </View>

              <View style={styles.rows}>
                {sessionRows.map((r, i) => (
                  <InfoRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    last={i === sessionRows.length - 1}
                  />
                ))}
              </View>
            </View>

            <View style={styles.fadeWrap}>
              <LinearGradient
                colors={['rgba(100,140,190,0.28)', 'rgba(100,140,190,0)']}
                style={StyleSheet.absoluteFill}
              />

              <Pressable
                onPress={() => setConfirmingDelete(true)}
                disabled={dangerBusy}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.wipeBtn,
                  dangerBusy && styles.off,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.wipeBtnText}>Fshi të gjitha të dhënat</Text>
              </Pressable>
            </View>

            {/* ── Historia e hyrjeve · veprimet · zona e rrezikut ─ */}
            <View style={styles.card}>
              <View style={styles.cardHeadSplit}>
                <Text style={styles.cardHeadText}>Historia e hyrjeve</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{loginRows.length}</Text>
                </View>
              </View>

              {loginRows.length > 0 ? (
                <View style={styles.rows}>
                  {loginRows.map((s, i) => (
                    <InfoRow
                      key={s.id}
                      label={s.current ? `${s.name} · ky sesion` : s.name}
                      value={when(s.last_used_at ?? s.created_at)}
                      last={i === loginRows.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                      {sessionsError ?? (sessions ? 'Nuk ka regjistrime të hyrjeve.' : 'Duke u ngarkuar…')}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.subWrap}>
                <Text style={styles.subText}>Veprimet e shpejta</Text>
              </View>

              <View style={styles.rows}>
                {QUICK_ACTIONS.map((a, i) => (
                  <ActionRow
                    key={a.label}
                    label={a.label}
                    color={a.color}
                    onPress={a.route ? () => router.push(a.route as never) : undefined}
                    last={i === QUICK_ACTIONS.length - 1}
                  />
                ))}
              </View>

              <View style={styles.danger}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View pointerEvents="none" style={styles.dangerTint} />

                <Text style={styles.dangerTitle}>Zona e rrezikut</Text>
                <Text style={styles.dangerDesc}>
                  Veprimet e mëposhtme janë të pakthyeshme. Veproni me kujdes.
                </Text>

                <View style={styles.dangerBtns}>
                  <Pressable
                    onPress={onDeactivate}
                    disabled={dangerBusy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.dangerGhost,
                      dangerBusy && styles.off,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dangerGhostText} numberOfLines={1}>
                      Çaktivizo llogarinë
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmingDelete(true)}
                    disabled={dangerBusy}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.dangerSolid,
                      dangerBusy && styles.off,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dangerSolidText} numberOfLines={1}>
                      Fshi të gjitha të dhënat
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {confirmingDelete ? (
        <DeleteAccountModal
          token={token}
          onClose={() => setConfirmingDelete(false)}
          onDeleted={() => {
            signOut();
            router.replace('/login');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
    },

    canvas: {
      flex: 1,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
      paddingTop: 2,
      paddingBottom: 8,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backBtn: {
      height: 34,
      justifyContent: 'center',
      marginLeft: -8,
      paddingRight: 10,
    },

    headerText: {
      flex: 1,
      justifyContent: 'center',
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: C.text,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 18,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.cardBorder,
      borderRadius: 8,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadSplit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: C.text,
    },

    badge: {
      minWidth: 22,
      height: 20,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.badgeBg,
      borderRadius: 999,
    },

    badgeText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 13,
      color: C.gray,
    },

    /* ── Security score ──────────────────────────────────────── */
    scoreWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },

    scoreDivider: {
      height: 1,
      marginTop: 14,
      backgroundColor: C.rowLine,
    },

    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    scoreLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    scoreValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.ok,
    },

    track: {
      height: 7,
      marginTop: 9,
      backgroundColor: C.track,
      borderRadius: 999,
      overflow: 'hidden',
    },

    trackFill: {
      height: 7,
      backgroundColor: C.ok,
      borderRadius: 999,
    },

    /* ── Rows ────────────────────────────────────────────────── */
    rows: {
      paddingHorizontal: 16,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    rowLast: {
      borderBottomWidth: 0,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginRight: 10,
    },

    rowText: {
      flex: 1,
      paddingRight: 10,
    },

    rowTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.2,
      color: C.text,
    },

    rowDesc: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    rowAction: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.red,
    },

    /* ── 2FA inline panel ────────────────────────────────────── */
    panel: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: 'rgba(27,111,191,0.06)',
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    panelTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    panelHint: {
      marginTop: 3,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
    },

    secret: {
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: 1.5,
      textAlign: 'center',
      color: C.text,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    link: {
      marginTop: 6,
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 14,
      color: C.blue,
    },

    panelField: {
      height: 40,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    panelError: {
      marginTop: 8,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.red,
    },

    panelBtns: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    panelGhost: {
      flex: 1,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    panelGhostText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    panelPrimary: {
      flex: 1,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(54,172,107,0.20)',
      borderWidth: 1,
      borderColor: C.ok,
      borderRadius: 4,
    },

    panelPrimaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    panelSolid: {
      flex: 1,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 4,
    },

    panelSolidText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.white,
    },

    codes: {
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    codeLine: {
      paddingVertical: 3,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 1,
      textAlign: 'center',
      color: C.text,
    },

    /* ── Key / value rows ────────────────────────────────────── */
    kvRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    kvLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
      paddingRight: 12,
    },

    kvValue: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 17,
      color: C.gray,
      textAlign: 'right',
    },

    /* ── Sub-section label ───────────────────────────────────── */
    subWrap: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 2,
    },

    subText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      color: C.gray,
    },

    /* ── Fade cast downward from the session table ───────────── */
    fadeWrap: {
      paddingTop: 12,
      paddingBottom: 12,
    },

    /* Clear button sitting inside that fade */
    wipeBtn: {
      marginHorizontal: 14,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
    },

    wipeBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.red,
    },

    /* ── Empty state ─────────────────────────────────────────── */
    emptyWrap: {
      padding: 16,
    },

    emptyBox: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: C.emptyBorder,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      textAlign: 'center',
    },

    /* ── Quick actions ───────────────────────────────────────── */
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 40,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    actionLabel: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.2,
      paddingRight: 10,
    },

    /* ── Danger zone — attached to the bottom of the table, glassy */
    danger: {
      overflow: 'hidden',
      backgroundColor: C.dangerBg,
      borderTopWidth: 1,
      borderTopColor: C.dangerBorder,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    dangerTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(224,49,49,0.30)',
    },

    dangerTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      letterSpacing: -0.2,
      color: C.text,
    },

    dangerDesc: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
      marginTop: 3,
    },

    dangerBtns: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    dangerGhost: {
      flex: 1,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(224,49,49,0.18)',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
      paddingHorizontal: 6,
    },

    dangerGhostText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    dangerSolid: {
      flex: 1,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 4,
      paddingHorizontal: 6,
    },

    dangerSolidText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: '#F5F5F5',
    },

    /* A dimmed danger action while a request is in flight. */
    off: {
      opacity: 0.6,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
