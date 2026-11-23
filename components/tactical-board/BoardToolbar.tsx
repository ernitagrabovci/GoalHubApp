import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tactical } from '@/constants/tactical-theme';
import type { PitchMode } from '@/lib/tactical/types';

const SPEEDS = [1, 2, 3, 5, 8];

type Props = {
  landscape: boolean;

  onBack: () => void;

  timerSeconds: number;
  timerRunning: boolean;
  onTimerToggle: () => void;
  onTimerReset: () => void;

  playing: boolean;
  onPlayToggle: () => void;

  speed: number;
  onSpeedChange: (speed: number) => void;

  pitchMode: PitchMode;
  onPitchToggle: () => void;

  fullscreen: boolean;
  onFullscreen: () => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  canDelete: boolean;
  onDelete: () => void;

  saving: boolean;
  onSave: () => void;

  onAi: () => void;
};

function clock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
  tint = Tactical.text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.iconBtn,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={21} color={tint} />
    </Pressable>
  );
}

function LabelButton({
  icon,
  label,
  onPress,
  tone = 'plain',
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'plain' | 'save' | 'ai';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.labelBtn,
        tone === 'save' && styles.saveBtn,
        tone === 'ai' && styles.aiBtn,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={tone === 'plain' ? Tactical.text : tone === 'save' ? Tactical.saveInk : Tactical.aiInk}
      />
      <Text
        style={[
          styles.labelText,
          tone === 'save' && styles.saveText,
          tone === 'ai' && styles.aiText,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BoardToolbar(props: Props) {
  const {
    landscape,
    onBack,
    timerSeconds,
    timerRunning,
    onTimerToggle,
    onTimerReset,
    playing,
    onPlayToggle,
    speed,
    onSpeedChange,
    pitchMode,
    onPitchToggle,
    fullscreen,
    onFullscreen,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    canDelete,
    onDelete,
    saving,
    onSave,
    onAi,
  } = props;

  const firstRow = (
    <>
      <IconButton icon="arrow-left" label="Kthehu prapa" onPress={onBack} />

      <Pressable
        onPress={onTimerToggle}
        onLongPress={onTimerReset}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel="Kohëmatësi"
        accessibilityHint="Shtyp për të nisur ose ndalur, mbaj shtypur për të rinisur"
        style={({ pressed }) => [
          styles.timer,
          timerRunning && styles.timerRunning,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          name={timerRunning ? 'pause' : 'play'}
          size={15}
          color={timerRunning ? Tactical.saveInk : Tactical.textDim}
        />
        <Text style={[styles.timerText, timerRunning && styles.timerTextRunning]}>
          {clock(timerSeconds)}
        </Text>
      </Pressable>

      <IconButton
        icon={playing ? 'stop' : 'play'}
        label={playing ? 'Ndalo animimin' : 'Luaj fazat'}
        onPress={onPlayToggle}
      />

      <Pressable
        onPress={() => {
          const i = SPEEDS.indexOf(speed);
          onSpeedChange(SPEEDS[(i + 1) % SPEEDS.length]);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Shpejtësia ${speed}x`}
        style={({ pressed }) => [styles.speed, pressed && styles.pressed]}
      >
        <Text style={styles.speedX}>x</Text>
        <View style={styles.speedBox}>
          <Text style={styles.speedValue}>{speed}</Text>
        </View>
      </Pressable>

      <LabelButton
        icon="soccer-field"
        label={pitchMode === 'full' ? '1/2 Fusha' : 'Fusha'}
        onPress={onPitchToggle}
      />

      <IconButton
        icon={fullscreen ? 'fullscreen-exit' : 'fullscreen'}
        label={fullscreen ? 'Dil nga ekrani i plotë' : 'Ekran i plotë'}
        onPress={onFullscreen}
      />
    </>
  );

  const secondRow = (
    <>
      <IconButton icon="undo" label="Kthe veprimin" onPress={onUndo} disabled={!canUndo} />
      <IconButton icon="redo" label="Përsërit veprimin" onPress={onRedo} disabled={!canRedo} />
      <IconButton
        icon="trash-can-outline"
        label="Fshij objektin"
        onPress={onDelete}
        disabled={!canDelete}
        tint={canDelete ? Tactical.danger : Tactical.textFaint}
      />

      <Pressable
        onPress={onSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Ruaj ushtrimin"
        style={({ pressed }) => [
          styles.labelBtn,
          styles.saveBtn,
          saving && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {saving ? (
          <ActivityIndicator size="small" color={Tactical.saveInk} />
        ) : (
          <MaterialCommunityIcons
            name="content-save-outline"
            size={19}
            color={Tactical.saveInk}
          />
        )}
        <Text style={[styles.labelText, styles.saveText]} numberOfLines={1}>
          {saving ? 'Po ruan…' : 'Ruaj'}
        </Text>
      </Pressable>

      <LabelButton icon="robot-outline" label="Gjenero me AI" onPress={onAi} tone="ai" />
    </>
  );

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {firstRow}
        {landscape ? secondRow : null}
      </ScrollView>
      {landscape ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {secondRow}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingVertical: 2,
  },
  row: {
    gap: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: 'rgba(5,12,24,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBtn: {
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: 'rgba(5,12,24,0.24)',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    color: Tactical.text,
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Tactical.save,
    borderColor: Tactical.save,
  },
  saveText: {
    color: Tactical.saveInk,
    fontWeight: '700',
  },
  aiBtn: {
    backgroundColor: Tactical.ai,
    borderColor: Tactical.ai,
  },
  aiText: {
    color: Tactical.aiInk,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.72,
  },
  timer: {
    height: 44,
    minWidth: 96,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: 'rgba(5,12,24,0.24)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timerRunning: {
    backgroundColor: Tactical.save,
    borderColor: Tactical.save,
  },
  timerText: {
    color: Tactical.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerTextRunning: {
    color: Tactical.saveInk,
  },
  speed: {
    height: 44,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  speedX: {
    color: Tactical.textDim,
    fontSize: 15,
    fontWeight: '700',
  },
  speedBox: {
    minWidth: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Tactical.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  speedValue: {
    color: Tactical.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
