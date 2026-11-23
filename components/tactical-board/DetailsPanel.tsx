import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BoardSelect } from '@/components/tactical-board/BoardSelect';
import { Tactical } from '@/constants/tactical-theme';
import { Fonts } from '@/constants/theme';
import {
  CATEGORIES,
  DIFFICULTIES,
  type BoardMeta,
  type BoardObject,
  type MovementTrack,
  type ObjKind,
  type Team,
} from '@/lib/tactical/types';

const KIND_LABEL: Record<ObjKind, string> = {
  player: 'Lojtar',
  gk: 'Portier',
  ball: 'Top',
  cone: 'Kon',
  coneSmall: 'Kon i vogël',
  arrow: 'Shigjetë',
  line: 'Vijë',
  zone: 'Zonë',
  text: 'Tekst',
};

const TEAM_LABEL: Record<Team, string> = {
  home: 'Shtëpi',
  away: 'Mysafir',
  gk: 'Portier',
};

const SWATCHES = [
  '#FFFFFF',
  Tactical.home,
  Tactical.away,
  Tactical.gk,
  Tactical.cone,
  Tactical.selected,
  '#FF4FD8',
  Tactical.black,
];

type Props = {
  meta: BoardMeta;
  onMeta: (patch: Partial<BoardMeta>) => void;
  selected: BoardObject | null;
  onUpdateSelected: (patch: Partial<BoardObject>) => void;
  track: MovementTrack | null;
  onTrack: (patch: Partial<MovementTrack>) => void;
  open: boolean;
  onToggle: () => void;
  collapsible: boolean;
};

function numberText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function DetailsPanel({
  meta,
  onMeta,
  selected,
  onUpdateSelected,
  track,
  onTrack,
  open,
  onToggle,
  collapsible,
}: Props) {
  const expanded = collapsible ? open : true;

  return (
    <View style={styles.panel}>
      <Pressable
        onPress={collapsible ? onToggle : undefined}
        disabled={!collapsible}
        style={styles.header}
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityLabel="Detajet e ushtrimit"
      >
        <Text style={styles.headerTitle}>Detajet e ushtrimit</Text>
        {collapsible ? (
          <MaterialCommunityIcons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={Tactical.textDim}
          />
        ) : null}
      </Pressable>

      {expanded ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Titulli</Text>
          <TextInput
            value={meta.title}
            onChangeText={(title) => onMeta({ title })}
            placeholder="Titulli i ushtrimit"
            placeholderTextColor={Tactical.textFaint}
            style={styles.input}
          />

          <Text style={styles.label}>Përshkrimi</Text>
          <TextInput
            value={meta.description}
            onChangeText={(description) => onMeta({ description })}
            placeholder="Përshkrimi i ushtrimit"
            placeholderTextColor={Tactical.textFaint}
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Kategoria</Text>
          <BoardSelect
            value={meta.category}
            options={CATEGORIES}
            onChange={(category) => onMeta({ category })}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Koha (min)</Text>
              <TextInput
                value={numberText(meta.minutes)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  onMeta({ minutes: Number.isFinite(n) ? n : null });
                }}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={Tactical.textFaint}
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Përsëritje</Text>
              <TextInput
                value={numberText(meta.reps)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  onMeta({ reps: Number.isFinite(n) ? n : null });
                }}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={Tactical.textFaint}
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>Vështirë</Text>
          <View style={styles.segment}>
            {DIFFICULTIES.map((d) => {
              const active = meta.difficulty === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => onMeta({ difficulty: d })}
                  style={[styles.segItem, active && styles.segItemActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>{d}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {selected ? (
            <View style={styles.objectBlock}>
              <View style={styles.objectHead}>
                <MaterialCommunityIcons
                  name="cursor-default-click"
                  size={15}
                  color={Tactical.selected}
                />
                <Text style={styles.objectTitle}>{KIND_LABEL[selected.kind]}</Text>
              </View>

              {(selected.kind === 'player' || selected.kind === 'gk') && (
                <>
                  <Text style={styles.label}>Numri</Text>
                  <TextInput
                    value={numberText(selected.number)}
                    onChangeText={(t) => {
                      const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                      onUpdateSelected({ number: Number.isFinite(n) ? n : undefined });
                    }}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor={Tactical.textFaint}
                    style={styles.input}
                  />
                </>
              )}

              {selected.team ? (
                <>
                  <Text style={styles.label}>Ekipi</Text>
                  <View style={styles.segment}>
                    {(['home', 'away', 'gk'] as Team[]).map((team) => {
                      const active = selected.team === team;
                      return (
                        <Pressable
                          key={team}
                          onPress={() => onUpdateSelected({ team })}
                          style={[styles.segItem, active && styles.segItemActive]}
                        >
                          <Text style={[styles.segText, active && styles.segTextActive]}>
                            {TEAM_LABEL[team]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {selected.kind === 'text' ? (
                <>
                  <Text style={styles.label}>Teksti</Text>
                  <TextInput
                    value={selected.text ?? ''}
                    onChangeText={(text) => onUpdateSelected({ text })}
                    placeholder="Shkruaj tekstin"
                    placeholderTextColor={Tactical.textFaint}
                    style={styles.input}
                  />
                </>
              ) : null}

              <Text style={styles.label}>Ngjyra</Text>
              <View style={styles.swatches}>
                {SWATCHES.map((c) => {
                  const active = (selected.color ?? '').toLowerCase() === c.toLowerCase();
                  return (
                    <Pressable
                      key={c}
                      onPress={() => onUpdateSelected({ color: c })}
                      accessibilityLabel={`Ngjyra ${c}`}
                      style={[
                        styles.swatch,
                        { backgroundColor: c },
                        active && styles.swatchActive,
                      ]}
                    />
                  );
                })}
              </View>

              {selected.kind === 'arrow' ? (
                <>
                  <Text style={styles.label}>Stili</Text>
                  <View style={styles.segment}>
                    {(['solid', 'dashed'] as const).map((s) => {
                      const active = selected.style === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => onUpdateSelected({ style: s })}
                          style={[styles.segItem, active && styles.segItemActive]}
                        >
                          <Text style={[styles.segText, active && styles.segTextActive]}>
                            {s === 'solid' ? 'E mbushur' : 'Me vija'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {track ? (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Shpejtësia</Text>
                    <TextInput
                      value={numberText(track.speed ?? 1)}
                      onChangeText={(t) => {
                        const n = parseFloat(t.replace(/[^0-9.]/g, ''));
                        onTrack({ speed: Number.isFinite(n) && n > 0 ? n : undefined });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={Tactical.textFaint}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Vonesa (s)</Text>
                    <TextInput
                      value={numberText(track.startDelay ?? 0)}
                      onChangeText={(t) => {
                        const n = parseFloat(t.replace(/[^0-9.]/g, ''));
                        onTrack({ startDelay: Number.isFinite(n) ? n : 0 });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Tactical.textFaint}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.empty}>Zgjidh një objekt për të parë vetitë</Text>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Tactical.panel,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    overflow: 'hidden',
  },
  header: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Tactical.borderSoft,
  },
  headerTitle: {
    color: Tactical.text,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  scroll: {
    maxHeight: 330,
  },
  content: {
    padding: 14,
    paddingBottom: 26,
    gap: 6,
  },
  label: {
    color: Tactical.textDim,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '600',
  },
  input: {
    minHeight: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: 'rgba(5,12,24,0.30)',
    color: Tactical.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  multiline: {
    minHeight: 68,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
  },
  segItem: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(5,12,24,0.30)',
  },
  segItemActive: {
    backgroundColor: Tactical.selected,
  },
  segText: {
    color: Tactical.textDim,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  segTextActive: {
    color: Tactical.black,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Tactical.borderSoft,
    marginTop: 12,
    marginBottom: 6,
  },
  objectBlock: {
    gap: 2,
  },
  objectHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  objectTitle: {
    color: Tactical.text,
    fontSize: 13,
    fontWeight: '700',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Tactical.borderSoft,
  },
  swatchActive: {
    borderColor: Tactical.selected,
    borderWidth: 2.5,
  },
  empty: {
    color: Tactical.textFaint,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
});
