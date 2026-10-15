import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlayerForm } from '@/components/players/player-form';
import { ApiError } from '@/lib/api/errors';
import { getPlayer } from '@/lib/api/players';
import type { ApiPlayer } from '@/lib/api/types';
import { useSession } from '@/lib/session';

/**
 * Edito lojtarin — same form as registration, titled with the player's name.
 * Loads the player with `GET /players/{id}` and hands it to the shared form in
 * edit mode. Without an `id` it falls back to the placeholder player, the way
 * the page rendered before the real rows carried data.
 */

const FALLBACK = { name: 'Narti Cerkini', team: 'Ekipi i Parë', nr: '1' };

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function EditPlayerScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{ id?: string; name?: string; team?: string; nr?: string }>();

  const id = params.id ? Number(params.id) : null;
  const hasId = id != null && !Number.isNaN(id);

  const [player, setPlayer] = useState<ApiPlayer | null>(null);

  useEffect(() => {
    if (!token || !hasId || id == null) return;
    const controller = new AbortController();

    getPlayer(token, id, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlayer(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, hasId, id, signOut, router]);

  /* No real id — keep the static placeholder behaviour. */
  if (!hasId) {
    const name = params.name ?? FALLBACK.name;
    const team = params.team ?? FALLBACK.team;
    const nr = params.nr ?? FALLBACK.nr;

    return (
      <PlayerForm title={name} subtitle={`${team} *Nr.${nr}`} avatarInitials={initialsOf(name)} />
    );
  }

  if (!player) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color="#159447" />
        </View>
      </SafeAreaView>
    );
  }

  const name = player.name ?? params.name ?? FALLBACK.name;
  const team = player.team?.name ?? params.team ?? FALLBACK.team;
  const nr = player.jersey_number != null ? String(player.jersey_number) : params.nr ?? FALLBACK.nr;

  return (
    <PlayerForm
      title={name}
      subtitle={`${team} *Nr.${nr}`}
      avatarInitials={initialsOf(name)}
      player={player}
      mode="edit"
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
