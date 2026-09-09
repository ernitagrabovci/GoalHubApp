import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Fushat e stërvitjes — opened from the club profile's "Fushat e stërvitjes"
 * card. Same visual language as Sezoni/Kompeticionet. A control row (field
 * dropdown + green "+ Shto fushë") sits above a detail card for the selected
 * field. "+ Shto fushë" and the card's "edit" button open a shared compact
 * create/edit modal (the weekly availability grid is its core), rendered as an
 * in-tree BlurView overlay so the page behind is truly blurred.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',
  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',
  text: '#111111',
  gray: '#8A8A8A',
  label: '#737373',
  value: '#0A0A0A',
  selectBorder: '#777777',
  mint: '#DCEEE8',
  mintBorder: '#7A9B91',
  mintText: '#0F3D2E',
  green: '#059A55',
  black: '#000000',
  editText: '#8A8A8A',
  red: '#E03131',
  white: '#FFFFFF',
};

/* Create/edit-field modal palette (matches the reference popup) */
const MO = {
  card: '#F8FAFA',
  border: '#159B63',
  divider: '#55B88B',
  title: '#080808',
  text: '#111111',
  sub: '#666666',
  radio: '#555555',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  ph: '#A8A8A8',
  tableBorder: '#83AFC5',
  tableHead: '#E3F1F8',
  rowBg: '#F2FAFD',
  rowLine: 'rgba(131,175,197,0.35)',
  green: '#08A83E',
  closed: '#6B6B6B',
  cancel: '#ED5050',
  create: '#16A51D',
  white: '#FFFFFF',
  err: '#C90000',
};

type DayRow = {
  name: string;
  from: string;
  to: string;
  open: boolean;
};

type Field = {
  id: number;
  label: string; // shown in the dropdown (may include the surface type)
  name: string; // shown as the card title
  address: string;
  capacity: string;
  dimensions: string;
  lighting: string;
  availability: string;
  lloji?: string;
  statusi?: string;
  changingRoom?: string;
  notes?: string;
  weekly?: DayRow[];
};

const SEED: Field[] = [
  {
    id: 1,
    label: 'Fusha Qendrore-Natyrale',
    name: 'Fusha Qendrore',
    address: 'Stadiumi i Qytetit, Prishtinë',
    capacity: '12.000 spekt.',
    dimensions: '105x68',
    lighting: 'Po',
    availability: 'Asnjë ditë e hapur.',
  },
  {
    id: 2,
    label: 'Fusha Dytësore',
    name: 'Fusha Dytësore',
    address: 'Kompleksi i Stadiumit, Prishtinë',
    capacity: '5.000 spekt.',
    dimensions: '105x68',
    lighting: 'Po',
    availability: 'Asnjë ditë e hapur.',
  },
  {
    id: 3,
    label: 'Fusha Sintetike e Trajnimit',
    name: 'Fusha Sintetike e Trajnimit',
    address: 'Rruga e Stadiumit, Prishtinë',
    capacity: '300 spekt.',
    dimensions: '100x64',
    lighting: 'Po',
    availability: 'E hënë – E premte, 17:00 – 20:00',
  },
  {
    id: 4,
    label: 'Fusha e Akademisë',
    name: 'Fusha e Akademisë',
    address: 'Fushë Kosovë',
    capacity: '200 spekt.',
    dimensions: '105x68',
    lighting: 'Jo',
    availability: 'E shtunë, 09:00 – 13:00',
  },
  {
    id: 5,
    label: 'Fusha e Rezervës',
    name: 'Fusha e Rezervës',
    address: 'Lagjja e Dardanisë, Prishtinë',
    capacity: '—',
    dimensions: '90x60',
    lighting: 'Jo',
    availability: 'Asnjë ditë e hapur.',
  },
];

let nextFieldId = 6;

/* Modal option sets */
const LLOJI = ['Natyrale', 'Sintetike', 'Hibrid'];
const STATUSI = ['Aktive', 'Pasive'];
const KAPACITETI = ['500 spekt.', '1.000 spekt.', '5.000 spekt.', '12.000 spekt.'];
const DIMENSIONET = ['90x45', '100x60', '105x68'];
const DHOMA = ['Po', 'Jo'];

/* Default weekly state (matches the reference screenshot) */
const WEEK: DayRow[] = [
  { name: 'E Hene', from: '07:00', to: '07:00', open: true },
  { name: 'E Marte', from: '07:00', to: '07:00', open: true },
  { name: 'E Merkure', from: '07:00', to: '07:00', open: true },
  { name: 'E Enjte', from: '07:00', to: '07:00', open: false },
  { name: 'E Premte', from: '07:00', to: '07:00', open: false },
  { name: 'E Shtune', from: '07:00', to: '07:00', open: false },
  { name: 'E Djele', from: '07:00', to: '07:00', open: false },
];

const cloneWeek = () => WEEK.map((d) => ({ ...d }));

const allClosedWeek = () => WEEK.map((d) => ({ ...d, open: false }));

function availabilityFrom(days: DayRow[]) {
  const open = days.filter((d) => d.open);
  return open.length === 0 ? 'Asnjë ditë e hapur.' : open.map((d) => d.name).join(', ');
}

/* Weekly initial — use stored schedule, else derive from availability.
   A brand-new field defaults to the first three days open (matches the sample). */
function initialWeek(f?: Field): DayRow[] {
  if (f?.weekly?.length) return f.weekly.map((d) => ({ ...d }));
  if (!f) return cloneWeek();
  if (f.availability && !f.availability.includes('Asnjë')) return cloneWeek();
  return allClosedWeek();
}

/* Split / rebuild "HH:MM" clock strings so hour and minute edit in their own box */
const splitTime = (t: string): [string, string] => {
  const [h = '', m = ''] = t.split(':');
  return [h, m];
};

const joinTime = (h: string, m: string) => `${h}:${m}`;

const timeDigits = (v: string) => v.replace(/[^0-9]/g, '').slice(0, 2);

type FieldPayload = {
  name: string;
  address: string;
  capacity: string;
  dimensions: string;
  lighting: string;
  availability: string;
  lloji: string;
  statusi: string;
  changingRoom: string;
  notes: string;
  weekly: DayRow[];
};

export default function FushatScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [fields, setFields] = useState<Field[]>(SEED);
  const [currentId, setCurrentId] = useState(1);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; field: Field }>(null);

  const sel = fields.find((f) => f.id === currentId) ?? null;

  const pick = (id: number) => {
    setCurrentId(id);
    setOpen(false);
  };

  const openAdd = () => setModal({ mode: 'add' });

  const openEdit = (f: Field) => setModal({ mode: 'edit', field: f });

  const removeField = (id: number) => {
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    if (currentId === id) {
      setCurrentId(next.length ? next[0].id : 0);
    }
  };

  const save = (p: FieldPayload) => {
    if (!modal) return;
    if (modal.mode === 'add') {
      const nf: Field = {
        id: nextFieldId++,
        label: p.name,
        name: p.name,
        address: p.address,
        capacity: p.capacity,
        dimensions: p.dimensions,
        lighting: p.lighting,
        availability: p.availability,
        lloji: p.lloji,
        statusi: p.statusi,
        changingRoom: p.changingRoom,
        notes: p.notes,
        weekly: p.weekly.map((d) => ({ ...d })),
      };
      setFields((prev) => [...prev, nf]);
      setCurrentId(nf.id);
    } else {
      const target = modal.field;
      setFields((prev) =>
        prev.map((f) =>
          f.id === target.id
            ? {
                ...f,
                label: f.name === p.name ? f.label : p.name,
                name: p.name,
                address: p.address,
                capacity: p.capacity,
                dimensions: p.dimensions,
                lighting: p.lighting,
                availability: p.availability,
                lloji: p.lloji,
                statusi: p.statusi,
                changingRoom: p.changingRoom,
                notes: p.notes,
                weekly: p.weekly.map((d) => ({ ...d })),
              }
            : f,
        ),
      );
    }
    setModal(null);
  };

  const detailRows = sel
    ? [
        { label: 'Adresa', value: sel.address },
        { label: 'Kapaciteti', value: sel.capacity },
        { label: 'Dimensionet', value: sel.dimensions },
        { label: 'Ndriçimi', value: sel.lighting },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
        </View>

        {/* Very subtle circular background pattern in the empty space below */}
        <View pointerEvents="none" style={styles.deco}>
          <View style={styles.decoRingOuter} />
          <View style={styles.decoRingInner} />
          <View style={styles.decoFill} />
        </View>

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
                <Text style={styles.title}>Fushat e stërvitjes</Text>
                <Text style={styles.subtitle}>{fields.length} fusha të regjistruara</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={modal === null}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Field control row ─────────────────────────────── */}
            <View style={styles.controlRow}>
              <Text style={styles.ctlLabel}>Fusha</Text>
              <Pressable
                onPress={() => setOpen((v) => !v)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ctlSelect, pressed && styles.pressed]}
              >
                <Text style={styles.ctlSelectText} numberOfLines={1}>
                  {sel ? sel.label : 'Zgjidh…'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.gray} />
              </Pressable>
              <Pressable
                onPress={openAdd}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ctlNew, pressed && styles.pressed]}
              >
                <Text style={styles.ctlNewText} numberOfLines={1}>
                  + Shto fushë
                </Text>
              </Pressable>
            </View>

            {open ? (
              <View style={styles.optBox}>
                {fields.map((f) => {
                  const active = f.id === currentId;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => pick(f.id)}
                      accessibilityRole="button"
                      style={[styles.opt, active && styles.optActive]}
                    >
                      <Text
                        style={[styles.optText, active && styles.optTextActive]}
                        numberOfLines={1}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* ── Field detail card ─────────────────────────────── */}
            {sel ? (
              <View style={[styles.card, styles.cardGap]}>
                <View style={styles.fcHead}>
                  <Text style={styles.fcTitle} numberOfLines={1}>
                    {sel.name}
                  </Text>
                  <View style={styles.fcActions}>
                    <Pressable
                      onPress={() => openEdit(sel)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.editText} numberOfLines={1}>
                        edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeField(sel.id)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.fshiBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.fshiText} numberOfLines={1}>
                        fshi
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.fcBody}>
                  {detailRows.map((r) => (
                    <View key={r.label} style={styles.detailRow}>
                      <Text style={styles.rowLabel}>{r.label}</Text>
                      <Text style={styles.rowValue}>{r.value}</Text>
                    </View>
                  ))}

                  <View style={styles.avail}>
                    <Text style={styles.availLabel}>Disponueshmëria Javore</Text>
                    <Text style={styles.availValue}>{sel.availability}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.card, styles.cardGap]}>
                <Text style={styles.emptyText}>Nuk ka fusha të regjistruara.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {modal ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setModal(null)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <FieldModal
            mode={modal.mode}
            field={modal.mode === 'edit' ? modal.field : null}
            onClose={() => setModal(null)}
            onSave={save}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit field modal                                            */
/* ------------------------------------------------------------------ */

type FieldModalProps = {
  mode: 'add' | 'edit';
  field: Field | null;
  onClose: () => void;
  onSave: (p: FieldPayload) => void;
};

function FieldModal({ mode, field, onClose, onSave }: FieldModalProps) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(300, height - 187);
  const isEdit = mode === 'edit';
  const src = field ?? null;

  const [name, setName] = useState(isEdit && src ? src.name : '');
  const [lloji, setLloji] = useState<string>(isEdit && src?.lloji ? src.lloji : LLOJI[0]);
  const [statusi, setStatusi] = useState<string>(
    isEdit && src?.statusi ? src.statusi : STATUSI[0],
  );
  const [address, setAddress] = useState(isEdit && src ? src.address : '');
  const [capacity, setCapacity] = useState<string>(isEdit && src ? src.capacity : '');
  const [dimensions, setDimensions] = useState<string>(
    isEdit && src ? src.dimensions : '',
  );
  const [lighting, setLighting] = useState(isEdit && src ? src.lighting === 'Po' : false);
  const [dhoma, setDhoma] = useState<string>(
    isEdit && src?.changingRoom ? src.changingRoom : DHOMA[0],
  );
  const [days, setDays] = useState<DayRow[]>(() => initialWeek(src ?? undefined));
  const [notes, setNotes] = useState(isEdit && src?.notes ? src.notes : '');
  const [err, setErr] = useState(false);

  const patchDay = (i: number, p: Partial<DayRow>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...p } : d)));

  const submit = () => {
    if (!name.trim() || !lloji || !statusi || !address.trim()) {
      setErr(true);
      return;
    }
    onSave({
      name: name.trim(),
      address: address.trim(),
      capacity: capacity || '—',
      dimensions: dimensions || '—',
      lighting: lighting ? 'Po' : 'Jo',
      availability: availabilityFrom(days),
      lloji,
      statusi,
      changingRoom: dhoma,
      notes: notes.trim(),
      weekly: days.map((d) => ({ ...d })),
    });
  };

  const title = mode === 'add' ? 'Shto fushë të re' : 'Ndrysho fushën';

  return (
    <View style={[styles.fmCard, { width: cardW }]}>
      <View style={styles.fmHeader}>
        <Text style={styles.fmTitle}>{title}</Text>
      </View>
      <View style={styles.fmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.fmContent}
      >
        {err ? <Text style={styles.fmErr}>Plotëso të gjitha fushat e kërkuara.</Text> : null}

        <Text style={styles.fmLabel}>Emri i fushës:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          allowFontScaling={false}
          style={styles.fmInput}
        />

        <View style={styles.fmRowTop}>
          <View style={styles.fmCol}>
            <Text style={styles.fmLabel}>Lloji:</Text>
            <FMSelect value={lloji} options={LLOJI} onChange={setLloji} />
          </View>
          <View style={styles.fmCol}>
            <Text style={styles.fmLabel}>Statusi:</Text>
            <FMSelect value={statusi} options={STATUSI} onChange={setStatusi} />
          </View>
        </View>

        <View style={styles.fmGroup}>
          <Text style={styles.fmLabel}>Adresa:</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            allowFontScaling={false}
            style={styles.fmInput}
          />
        </View>

        <View style={styles.fmRowTop}>
          <View style={styles.fmCol}>
            <Text style={styles.fmLabel}>Kapaciteti (spekt.):</Text>
            <FMSelect value={capacity} options={KAPACITETI} onChange={setCapacity} />
          </View>
          <View style={styles.fmCol}>
            <Text style={styles.fmLabel}>Dimensionet:</Text>
            <FMSelect
              value={dimensions}
              options={DIMENSIONET}
              onChange={setDimensions}
            />
          </View>
        </View>

        <View style={styles.fmRowTop}>
          <View style={styles.fmCol}>
            <Pressable
              onPress={() => setLighting((v) => !v)}
              accessibilityRole="radio"
              accessibilityState={{ checked: lighting }}
              style={({ pressed }) => [styles.fmRadioRow, pressed && styles.pressed]}
            >
              <View style={[styles.fmRadio, lighting && styles.fmRadioOn]}>
                {lighting ? <View style={styles.fmRadioDot} /> : null}
              </View>
              <Text style={styles.fmRadioText}>Ndriçim i instaluar</Text>
            </Pressable>
          </View>
          <View style={styles.fmCol}>
            <Text style={styles.fmLabel}>Dhoma zëvështoreje:</Text>
            <FMSelect value={dhoma} options={DHOMA} onChange={setDhoma} />
          </View>
        </View>

        <Text style={[styles.fmLabel, styles.fmAvailLabel]}>Disponueshmëria javore:</Text>
        <WeeklyTable days={days} onPatch={patchDay} />

        <Text style={[styles.fmLabel, styles.fmNotesLabel]}>Shenime:</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          allowFontScaling={false}
          style={styles.fmTextarea}
          textAlignVertical="top"
        />

        <View style={styles.fmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fmBtn, styles.fmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.fmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fmBtn, styles.fmBtnCreate, pressed && styles.pressed]}
          >
            <Text style={styles.fmBtnText}>Krijo sezonin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* Compact select with an in-flow options list */
function FMSelect({
  value,
  options,
  onChange,
  emptyLabel = '',
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const show = value ? value : emptyLabel;
  const isPh = !value;
  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.fmSel, pressed && styles.pressed]}
      >
        <Text style={[styles.fmSelText, isPh && styles.fmSelPh]} numberOfLines={1}>
          {show}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.fmOpts}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={[styles.fmOpt, active && styles.fmOptActive]}
              >
                <Text style={[styles.fmOptText, active && styles.fmOptTextActive]} numberOfLines={1}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* Weekly availability table — each time is two clear squares (hour + minute) */
function WeeklyTable({
  days,
  onPatch,
}: {
  days: DayRow[];
  onPatch: (i: number, p: Partial<DayRow>) => void;
}) {
  const fromParts = days.map((d) => splitTime(d.from));
  const toParts = days.map((d) => splitTime(d.to));
  return (
    <View style={styles.fmTable}>
      <View style={styles.fmTrHead}>
        <Text style={[styles.fmTh, styles.fmDayL]}>Dita</Text>
        <Text style={[styles.fmTh, styles.fmTimeL]}>Nga</Text>
        <Text style={[styles.fmTh, styles.fmTimeL]}>Deri</Text>
        <Text style={[styles.fmTh, styles.fmOpenL]}>Hapur</Text>
      </View>
      {days.map((d, i) => {
        const [fh, fm] = fromParts[i];
        const [th, tm] = toParts[i];
        return (
          <View key={d.name} style={[styles.fmTr, i > 0 && styles.fmTrBorder]}>
            <Text style={[styles.fmTd, styles.fmDayL, styles.fmDayName]} numberOfLines={1}>
              {d.name}
            </Text>
            <View style={styles.fmTimeCol}>
              <View style={styles.fmClock}>
                <TextInput
                  value={fh}
                  onChangeText={(v) => onPatch(i, { from: joinTime(timeDigits(v), fm) })}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.fmTimeBox}
                />
                <Text style={styles.fmClockColon}>:</Text>
                <TextInput
                  value={fm}
                  onChangeText={(v) => onPatch(i, { from: joinTime(fh, timeDigits(v)) })}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.fmTimeBox}
                />
              </View>
            </View>
            <View style={styles.fmTimeCol}>
              <View style={styles.fmClock}>
                <TextInput
                  value={th}
                  onChangeText={(v) => onPatch(i, { to: joinTime(timeDigits(v), tm) })}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.fmTimeBox}
                />
                <Text style={styles.fmClockColon}>:</Text>
                <TextInput
                  value={tm}
                  onChangeText={(v) => onPatch(i, { to: joinTime(th, timeDigits(v)) })}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.fmTimeBox}
                />
              </View>
            </View>
            <View style={styles.fmOpenCol}>
              <Pressable
                onPress={() => onPatch(i, { open: !d.open })}
                accessibilityRole="switch"
                accessibilityState={{ checked: d.open }}
                style={({ pressed }) => [styles.fmCircleHit, pressed && styles.pressed]}
              >
                <View style={[styles.fmCircle, d.open && styles.fmCircleOn]} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    deco: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -120,
      height: 340,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 0,
    },

    decoRingOuter: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
      borderWidth: 1,
      borderColor: 'rgba(21,148,71,0.05)',
      bottom: -120,
    },

    decoRingInner: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor: 'rgba(34,87,122,0.06)',
      bottom: -70,
    },

    decoFill: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(34,87,122,0.04)',
      bottom: -30,
      left: 30,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    header: {
      backgroundColor: C.page,
      paddingTop: 16,
      paddingBottom: 18,
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
      fontSize: 13,
      lineHeight: 17,
      color: C.gray,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 220,
    },

    /* Field control row */
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },

    ctlLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
      marginRight: 6,
    },

    ctlSelect: {
      width: 178,
      height: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.selectBorder,
      borderRadius: 2,
      paddingHorizontal: 7,
    },

    ctlSelectText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: C.text,
      marginRight: 4,
    },

    ctlNew: {
      width: 96,
      height: 28,
      marginLeft: 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.mint,
      borderWidth: 1,
      borderColor: C.mintBorder,
      borderRadius: 2,
      paddingHorizontal: 8,
    },

    ctlNewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.mintText,
    },

    optBox: {
      marginTop: -6,
      marginBottom: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.selectBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },

    opt: {
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 11,
    },

    optActive: {
      backgroundColor: 'rgba(5, 168, 90, 0.10)',
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

    /* Field detail card */
    card: {
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 8,
    },

    cardGap: {
      marginTop: 0,
    },

    fcHead: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    fcTitle: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
      marginRight: 10,
    },

    fcActions: {
      flexDirection: 'row',
      gap: 7,
    },

    editBtn: {
      height: 28,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.black,
      borderRadius: 3,
    },

    editText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.editText,
    },

    fshiBtn: {
      height: 28,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 3,
    },

    fshiText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.red,
    },

    fcBody: {
      paddingHorizontal: 16,
      paddingTop: 15,
      paddingBottom: 18,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: 30,
    },

    rowLabel: {
      width: 118,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.label,
      lineHeight: 18,
      paddingTop: 1,
    },

    rowValue: {
      flex: 1,
      fontFamily: Fonts.bodyMedium,
      fontSize: 12,
      color: C.value,
      lineHeight: 18,
      paddingTop: 1,
      textAlign: 'right',
    },

    avail: {
      marginTop: 22,
    },

    availLabel: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.label,
      marginBottom: 4,
    },

    availValue: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.label,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.gray,
      textAlign: 'center',
      paddingVertical: 18,
    },

    pressed: {
      opacity: 0.5,
    },

    /* ── Overlay (full-screen blur + dim + centered card) ───── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    /* ── Create/edit field modal ────────────────────────────── */
    fmCard: {
      marginTop: 116,
      alignSelf: 'center',
      backgroundColor: MO.card,
      borderWidth: 1,
      borderColor: MO.border,
      borderRadius: 5,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    fmHeader: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

    fmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    fmContent: {
      paddingHorizontal: 15,
      paddingTop: 9,
      paddingBottom: 15,
    },

    fmErr: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.err,
      marginBottom: 8,
    },

    fmLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    fmInput: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 0,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    fmGroup: {
      marginTop: 10,
    },

    fmRowTop: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 8,
    },

    fmCol: {
      flex: 1,
    },

    fmSel: {
      height: 31,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
    },

    fmSelText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
      marginRight: 3,
    },

    fmSelPh: {
      color: MO.ph,
    },

    fmOpts: {
      marginTop: 2,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      overflow: 'hidden',
    },

    fmOpt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    fmOptActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    fmOptText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.text,
    },

    fmOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: MO.create,
    },

    fmRadioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 31,
    },

    fmRadio: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: '#999999',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },

    fmRadioOn: {
      borderColor: MO.green,
    },

    fmRadioDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: MO.green,
    },

    fmRadioText: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: MO.radio,
    },

    fmAvailLabel: {
      marginTop: 12,
    },

    /* Weekly schedule table */
    fmTable: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: MO.tableBorder,
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor: MO.rowBg,
    },

    fmTrHead: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 31,
      backgroundColor: MO.tableHead,
    },

    fmTh: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10,
      color: '#222222',
    },

    fmTr: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 29,
      backgroundColor: MO.rowBg,
    },

    fmTrBorder: {
      borderTopWidth: 1,
      borderTopColor: MO.rowLine,
    },

    fmTd: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: '#333333',
    },

    fmDayL: {
      width: 74,
      paddingLeft: 10,
    },

    fmTimeL: {
      width: 60,
      textAlign: 'center',
    },

    fmOpenL: {
      flex: 1,
      textAlign: 'center',
    },

    fmDayName: {
      fontSize: 9,
      lineHeight: 12,
    },

    fmTimeCol: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fmClock: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    fmTimeBox: {
      width: 24,
      height: 22,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#6C8FA6',
      borderRadius: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 9.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    fmClockColon: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: '#666666',
      marginHorizontal: 1,
    },

    fmOpenCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fmCircleHit: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fmCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: MO.closed,
      backgroundColor: MO.card,
    },

    fmCircleOn: {
      backgroundColor: MO.green,
      borderColor: MO.green,
    },

    fmNotesLabel: {
      marginTop: 14,
    },

    fmTextarea: {
      height: 76,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    fmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 12,
    },

    fmBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },

    fmBtnCancel: {
      width: 74,
      backgroundColor: MO.cancel,
    },

    fmBtnCreate: {
      width: 92,
      backgroundColor: MO.create,
    },

    fmBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },
  }),
);
