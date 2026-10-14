import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { getClub, updateClub } from '@/lib/api/club';
import { ApiError } from '@/lib/api/errors';
import type { ApiClubProfile } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Profil i klubit — the club's single profile-editing page (admin).
 *
 * One route, one continuous vertical scroll: a pinned top header
 * ("Profil i klubit" + subtitle) stays fixed while the content sections —
 * Identitet Visual → Informacioni baze → Kompeticionet | Sezoni →
 * Fushat e stërvitjes → Kontaktet zyrtare → Rrjetet sociale →
 * Historia e klubit — scroll under it. No bottom navigation.
 *
 * Same visual language as the main admin dashboard: #FAFBFA canvas with
 * faint vertical lines, 27px side gutters, white/pale cards with thin
 * borders and green accents.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  card: '#F5F5F5',
  border: 'rgba(100,140,190,0.30)', // white info-card outline (dashboard style)
  fill: '#F6FBFF', // opaque light-blue interior (D4EDFF @ 20% over white — no bg shows through)
  headLine: 'rgba(30,40,35,0.10)', // card / row divider (dashboard DIVIDER)

  input: '#F4F7F5',
  inputBorder: '#000000',
  placeholder: '#A8A8A8',

  text: '#111111',
  gray: '#8A8A8A',

  green: '#159447',
  greenBright: '#159447',
  red: '#ED5050',

  greenCard: '#DDF6E7',
  greenBorder: '#69C994',
  greenBtn: '#159447',

  q1Bg: '#F2FBF5',
  q1Line: '#69C994',
  q1Btn: '#159447',

  q2Bg: '#F7EBD8',
  q2Line: '#E2C89B',
  q2Btn: '#D99A4A',

  swatchAway: '#F2EFE9',
};

const YEARS = Array.from({ length: 47 }, (_, i) => String(2026 - i)); // 2026 → 1980

const FCP = require('@/assets/dashboard/fcp.png');
const IMG_PLAYERS = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');
const IMG_TRAINING = require('@/assets/dashboard/stervitje.png');

/* ------------------------------------------------------------------ */
/* Small reusable form pieces                                          */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  containerStyle?: object;
  flex?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  containerStyle,
  flex,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline,
}: FieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        style={[styles.input, multiline && styles.textarea]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        allowFontScaling={false}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  open: boolean;
  onToggle: (id: string | null) => void;
  flex?: boolean;
};

function SelectField({ id, label, value, onChange, options, open, onToggle, flex }: SelectFieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => onToggle(open ? null : id)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        <Text
          style={[styles.selectText, !value && styles.placeholderText]}
          numberOfLines={1}
        >
          {value || 'Zgjidh…'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(16)} color={C.gray} />
      </Pressable>
      {open ? (
        <View style={styles.optBox}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.optList}
          >
            {options.map((o) => {
              const active = o === value;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    onChange(o);
                    onToggle(null);
                  }}
                  style={({ pressed }) => [
                    styles.opt,
                    active && styles.optActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optText, active && styles.optTextActive]}>{o}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type Form = {
  officialName: string;
  shortName: string;
  foundationYear: string;
  licenseNumber: string;
  city: string;
  country: string;
  address: string;
  federation: string;
  category: string;
  contactEmail: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  history: string;
};

const INITIAL_FORM: Form = {
  officialName: '',
  shortName: '',
  foundationYear: '',
  licenseNumber: '',
  city: '',
  country: '',
  address: '',
  federation: '',
  category: '',
  contactEmail: '',
  phone: '',
  website: '',
  facebook: '',
  instagram: '',
  youtube: '',
  twitter: '',
  history: '',
};

/** Flattens the API record onto the form's field names; nulls read as blanks. */
function toForm(club: ApiClubProfile): Form {
  const text = (v: string | null) => v ?? '';
  return {
    officialName: text(club.name),
    shortName: text(club.abbreviation),
    foundationYear: club.founded_year == null ? '' : String(club.founded_year),
    licenseNumber: text(club.license_number),
    city: text(club.city),
    country: text(club.country),
    address: text(club.address),
    federation: text(club.federation),
    category: text(club.category),
    contactEmail: text(club.email),
    phone: text(club.phone),
    website: text(club.website),
    facebook: text(club.facebook),
    instagram: text(club.instagram),
    youtube: text(club.youtube),
    twitter: text(club.twitter),
    history: text(club.description),
  };
}

export default function ClubProfileScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [openSel, setOpenSel] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getClub(token, controller.signal)
      .then((club) => {
        if (controller.signal.aborted) return;
        setForm(toForm(club));
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohet profili i klubit.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, signOut, router]);

  const set = (k: keyof Form) => (v: string) => {
    setSaved(false);
    setForm((p) => ({ ...p, [k]: v }));
  };

  const save = async () => {
    if (!token || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const optional = (v: string) => {
      const trimmed = v.trim();
      return trimmed === '' ? null : trimmed;
    };

    try {
      const updated = await updateClub(token, {
        name: form.officialName.trim(),
        abbreviation: optional(form.shortName),
        address: optional(form.address),
        city: optional(form.city),
        country: optional(form.country),
        phone: optional(form.phone),
        email: optional(form.contactEmail),
        website: optional(form.website),
        founded_year: form.foundationYear ? Number(form.foundationYear) : null,
        federation: optional(form.federation),
        category: optional(form.category),
        license_number: optional(form.licenseNumber),
        facebook: optional(form.facebook),
        instagram: optional(form.instagram),
        youtube: optional(form.youtube),
        twitter: optional(form.twitter),
        description: optional(form.history),
      });
      setForm(toForm(updated));
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        signOut();
        router.replace('/login');
        return;
      }
      setError(
        err instanceof ApiError && err.status === 422
          ? 'Disa fusha nuk plotësojnë kushtet. Kontrollo email-in, faqen e internetit dhe lidhjet sociale.'
          : err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ruhen ndryshimet.',
      );
    } finally {
      setSaving(false);
    }
  };

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
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={I(24)}
                  color={C.text}
                />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title}>Profil i klubit</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {form.officialName || '—'} · Informacioni zyrtar
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* One continuous scrollable page */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* Load / save feedback sits above the cards. */}
            {error ? (
              <View style={styles.stateRow}>
                <Text style={styles.stateError}>{error}</Text>
              </View>
            ) : loading ? (
              <View style={styles.stateRow}>
                <ActivityIndicator color={C.greenBright} />
              </View>
            ) : saved ? (
              <View style={styles.stateRow}>
                <Text style={styles.stateSaved}>Ndryshimet u ruajtën.</Text>
              </View>
            ) : null}

            {/* ── Identitet Visual ─────────────────────────────── */}
            <View style={[styles.card, { marginTop: 14 }]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Identitet Visual</Text>
              </View>

              {/* Logo upload */}
              <View style={styles.logoZone}>
                <Pressable
                  onPress={() => setShowLogo((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Ngarko ose ndrysho logon"
                  style={({ pressed }) => [styles.logoButton, pressed && styles.pressed]}
                >
                  {showLogo ? (
                    <View style={styles.crestWrap}>
                      <Image source={FCP} style={styles.crest} resizeMode="contain" />
                      <View style={styles.logoBadge}>
                        <MaterialCommunityIcons
                          name="cloud-upload-outline"
                          size={I(13)}
                          color="#F5F5F5"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.logoCircle}>
                      <MaterialCommunityIcons
                        name="cloud-upload-outline"
                        size={I(24)}
                        color="#F5F5F5"
                      />
                    </View>
                  )}
                </Pressable>
                <Text style={styles.logoHint}>Ngarko/Ndrysho logon</Text>
              </View>

              {/* Official colors */}
              <View style={styles.colors}>
                <Text style={styles.colorsLabel}>Ngjyrat Zyrtare</Text>
                <View style={styles.swatches}>
                  <ColorSwatch label="Home" color={C.green} />
                  <ColorSwatch label="Away" color={C.swatchAway} />
                  <ColorSwatch label="Third" color="#000000" />
                </View>
              </View>
            </View>

            {/* ── Informacioni baze ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Informacioni baze</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Emri Zyrtar" value={form.officialName} onChangeText={set('officialName')} flex />
                  <Field label="Shkurtesa" value={form.shortName} onChangeText={set('shortName')} autoCapitalize="characters" flex />
                </View>
                <View style={styles.gridRow}>
                  <SelectField id="foundation" label="Viti i themelimit" value={form.foundationYear} onChange={set('foundationYear')} options={YEARS} open={openSel === 'foundation'} onToggle={setOpenSel} flex />
                  <Field label="Nr. i Licencës" value={form.licenseNumber} onChangeText={set('licenseNumber')} flex />
                </View>
                <View style={styles.gridRow}>
                  <Field label="Qyteti" value={form.city} onChangeText={set('city')} flex />
                  <Field label="Shteti" value={form.country} onChangeText={set('country')} flex />
                </View>
                <Field label="Adresa" value={form.address} onChangeText={set('address')} />
                <View style={styles.gridRow}>
                  <Field label="Federata" value={form.federation} onChangeText={set('federation')} flex />
                  <Field label="Kategoria" value={form.category} onChangeText={set('category')} flex />
                </View>
              </View>
            </View>

            {/* ── Kompeticionet | Sezoni ───────────────────────── */}
            <View style={styles.quickRow}>
              <Pressable
                onPress={() => router.push('/competitions')}
                accessibilityRole="button"
                accessibilityLabel="Hap kompeticionet"
                style={({ pressed }) => [
                  styles.quickCard,
                  styles.quickCardA,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={IMG_PLAYERS} style={styles.quickImgPlayers} resizeMode="contain" />
                <Text style={styles.quickTitle}>Kompeticionet</Text>
                <GoButton color={C.q1Btn} onPress={() => router.push('/competitions')} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/sezoni')}
                accessibilityRole="button"
                accessibilityLabel="Hap sezonin"
                style={({ pressed }) => [
                  styles.quickCard,
                  styles.quickCardB,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={IMG_BALL} style={styles.quickImgBall} resizeMode="contain" />
                <Text style={styles.quickTitle}>Sezoni</Text>
                <GoButton color={C.q2Btn} onPress={() => router.push('/sezoni')} />
              </Pressable>
            </View>

            {/* ── Fushat e stërvitjes ──────────────────────────── */}
            <Pressable
              onPress={() => router.push('/fushat')}
              accessibilityRole="button"
              accessibilityLabel="Hap fushat e stërvitjes"
              style={({ pressed }) => [
                styles.trainingCard,
                styles.cardGap,
                pressed && styles.pressed,
              ]}
            >
              <Image source={IMG_TRAINING} style={styles.trainingImg} resizeMode="cover" />
              <Text style={styles.trainingTitle}>Fushat e stërvitjes</Text>
              <GoButton color={C.greenBtn} onPress={() => router.push('/fushat')} />
            </Pressable>

            {/* ── Kontaktet zyrtare ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Kontaktet zyrtare</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Email Zyrtar" value={form.contactEmail} onChangeText={set('contactEmail')} keyboardType="email-address" autoCapitalize="none" flex />
                  <Field label="Nr. Tel" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" flex />
                </View>
                <Field label="Faqja e internetit" value={form.website} onChangeText={set('website')} keyboardType="url" autoCapitalize="none" />
              </View>
            </View>

            {/* ── Rrjetet sociale ──────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Rrjetet sociale</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Facebook" value={form.facebook} onChangeText={set('facebook')} autoCapitalize="none" flex />
                  <Field label="Instagram" value={form.instagram} onChangeText={set('instagram')} autoCapitalize="none" flex />
                </View>
                <View style={styles.gridRow}>
                  <Field label="Youtube" value={form.youtube} onChangeText={set('youtube')} autoCapitalize="none" flex />
                  <Field label="Twitter/X" value={form.twitter} onChangeText={set('twitter')} autoCapitalize="none" flex />
                </View>
              </View>
            </View>

            {/* ── Historia e klubit ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Historia e klubit</Text>
              </View>
              <View style={styles.cardBody}>
                <Field
                  label="Përshkrim:"
                  value={form.history}
                  onChangeText={set('history')}
                  multiline
                  placeholder="Shkruaj historinë e klubit…"
                />
              </View>
            </View>

            {/* ── Actions ──────────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Anulo</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Ruaj ndryshimet"
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnSave,
                  saving && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#F5F5F5" />
                ) : (
                  <Text style={styles.btnText}>Ruaj ndryshimet</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Leaf helpers                                                        */
/* ------------------------------------------------------------------ */

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.swatchCol}>
      <View style={styles.swatchOuter}>
        <View style={[styles.swatchInner, { backgroundColor: color }]} />
      </View>
      <Text style={styles.swatchLabel}>{label}</Text>
    </View>
  );
}

function GoButton({ color, onPress }: { color: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Vazhdo"
      onPress={onPress}
      style={({ pressed }) => [styles.goBtn, { backgroundColor: color }, pressed && styles.goPressed]}
    >
      <Text style={styles.goBtnText}>Vazhdo</Text>
    </Pressable>
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

    /* Faint vertical canvas texture — same idea as the dashboards. */
    /* Shared column: fills the screen width so the fields use the side
       space instead of sitting in a narrow centered 375px column. */
    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
      paddingTop: 2,
      paddingBottom: 12,
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
      paddingBottom: 46,
    },

    /* Generic info card */
    card: {
      backgroundColor: C.fill,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
    },

    cardGap: {
      marginTop: 10,
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 9,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      color: C.text,
    },

    cardBody: {
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    /* Logo upload */
    logoZone: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.fill,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    logoButton: {
      alignItems: 'center',
    },

    logoCircle: {
      width: 55,
      height: 55,
      borderRadius: 24,
      backgroundColor: C.greenBright,
      alignItems: 'center',
      justifyContent: 'center',
    },

    crestWrap: {
      position: 'relative',
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: 27,
      borderWidth: 1,
      borderColor: C.border,
    },

    crest: {
      width: 0,
      height: 40,
    },

    logoBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: C.greenBright,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#F5F5F5',
    },

    logoHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
      marginTop: 8,
    },

    /* Official colors — compact centered row */
    colors: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 15,
    },

    colorsLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13.5,
      color: C.text,
    },

    swatches: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },

    swatchCol: {
      alignItems: 'center',
    },

    swatchOuter: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    swatchInner: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: 'rgba(30,40,35,0.12)',
    },

    swatchLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.gray,
      marginTop: 2,
    },

    /* Form primitives */
    gridRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    fieldWrap: {
      marginBottom: 8,
    },

    fieldFlex: {
      flex: 1,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
      marginBottom: 3,
    },

    input: {
      height: 28,
      backgroundColor: C.input,
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 9,
      paddingVertical: 0,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: Fonts.body,
      color: C.text,
    },

    textarea: {
      height: 80,
      paddingTop: 7,
      paddingBottom: 7,
    },

    /* Custom select */
    select: {
      height: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.input,
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 9,
    },

    selectText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
      flex: 1,
    },

    placeholderText: {
      color: C.placeholder,
    },

    optBox: {
      marginTop: 3,
      backgroundColor: '#F5F5F5',
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },

    optList: {
      maxHeight: 116,
    },

    opt: {
      height: 30,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },

    optActive: {
      backgroundColor: 'rgba(7, 155, 88, 0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    /* Kompeticionet | Sezoni */
    quickRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    quickCard: {
      flex: 1,
      height: 100,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      overflow: 'hidden',
    },

    quickCardA: {
      backgroundColor: C.q1Bg,
      borderColor: C.q1Line,
    },

    quickCardB: {
      backgroundColor: C.q2Bg,
      borderColor: C.q2Line,
    },

    quickImgPlayers: {
      position: 'absolute',
      left: -42,
      bottom: -54,
      width: 120,
      height: 120,
      zIndex: 0,
    },

    quickImgBall: {
      position: 'absolute',
      left: -34,
      bottom: -50,
      width: 108,
      height: 108,
      zIndex: 0,
    },

    quickTitle: {
      position: 'absolute',
      top: 11,
      left: 12,
      zIndex: 2,
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 23,
      letterSpacing: -0.4,
      color: C.text,
    },

    goBtn: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      zIndex: 2,
      minWidth: 64,
      height: 25,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },

    goPressed: {
      opacity: 0.85,
    },

    goBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: '#F5F5F5',
    },

    /* Fushat e stërvitjes */
    trainingCard: {
      height: 100,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: C.greenBorder,
      backgroundColor: C.greenCard,
      overflow: 'hidden',
    },

    trainingImg: {
      position: 'absolute',
      left: -70,
      bottom: -51,
      width: 168,
      height: 168,
      zIndex: 0,
    },

    trainingTitle: {
      position: 'absolute',
      top: 13,
      left: 45,
      zIndex: 2,
      fontFamily: Fonts.bodyBold,
      fontSize: 21,
      lineHeight: 25,
      letterSpacing: -0.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },

    /* Load / save feedback */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingTop: 12,
    },

    stateError: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.red,
      textAlign: 'center',
    },

    stateSaved: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.green,
      textAlign: 'center',
    },

    /* Actions below the cards */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    btn: {
      height: 40,
      minWidth: 84,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    btnCancel: {
      backgroundColor: C.red,
    },

    btnSave: {
      backgroundColor: C.green,
    },

    btnDisabled: {
      opacity: 0.6,
    },

    btnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: '#F5F5F5',
    },
  }),
);
