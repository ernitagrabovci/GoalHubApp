import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { DEFAULT_SCENES, type TacticalScene } from '@/lib/data';

export default function TacticalScreen() {
  const router = useRouter();
  const [scenes, setScenes] = useState<TacticalScene[]>(DEFAULT_SCENES);

  const toggleShare = (id: string) =>
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, shared: !s.shared } : s)));

  return (
    <Screen>
      <DetailHead
        icon="map.fill"
        accent={Colors.mintDim}
        title="tactical board"
        subtitle={`${scenes.length} saved scenes · build a formation, then drag players`}
      />

      <SectionLabel>saved scenes</SectionLabel>
      <View style={styles.list}>
        {scenes.length === 0 ? (
          <Text style={styles.empty}>No scenes yet — create one to start planning.</Text>
        ) : (
          scenes.map((scene) => (
            <Pressable
              key={scene.id}
              style={styles.card}
              onPress={() => router.push(`/tactical-editor?id=${scene.id}`)}>
              <View style={[styles.sceneIcon, { backgroundColor: `${Colors.mintDim}22` }]}>
                <IconSymbol name="map.fill" size={20} color={Colors.mintDim} />
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{scene.name}</Text>
                <Text style={styles.meta}>
                  {scene.formation} · {scene.players.length} players
                </Text>
                <Text style={styles.meta}>created {scene.created} · modified {scene.modified}</Text>
              </View>
              <Pressable
                style={[styles.shareBtn, scene.shared && styles.shareBtnOn]}
                onPress={() => toggleShare(scene.id)}
                hitSlop={8}>
                <IconSymbol
                  name="square.and.arrow.up"
                  size={14}
                  color={scene.shared ? Colors.textOnPrimary : Colors.mint}
                />
              </Pressable>
            </Pressable>
          ))
        )}
      </View>

      <Pressable
        style={styles.action}
        onPress={() => router.push('/tactical-editor')}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.actionText}>new scene</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sceneIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  shareBtnOn: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  empty: {
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
    textTransform: 'lowercase',
  },
});
