import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { ALL_PLAYERS, ALL_RATINGS, type Rating } from '@/lib/data';

function playerId(name: string) {
  return ALL_PLAYERS.find((p) => p.name === name)?.id ?? '';
}

function RatingRow({ rating, onPress }: { rating: Rating; onPress: () => void }) {
  return (
    <ListRow
      title={rating.player}
      subtitle={`tech ${rating.technique.toFixed(1)} · phy ${rating.physical.toFixed(1)} · tac ${rating.tactics.toFixed(1)} · con ${rating.consistency.toFixed(1)} · team ${rating.teamwork.toFixed(1)}`}
      leading={<InitialsTile initials={rating.initials} color={rating.color} />}
      trailing={
        <View style={styles.avgChip}>
          <Text style={styles.avgText}>{rating.average.toFixed(1)}</Text>
        </View>
      }
      onPress={onPress}
    />
  );
}

export default function RatingsScreen() {
  const router = useRouter();
  const sorted = [...ALL_RATINGS].sort((a, b) => b.average - a.average);
  return (
    <ListScreen back
      icon="star.fill"
      accent="#f5a623"
      title="ratings"
      subtitle="5-criteria · ranked by average"
      searchable
      searchPlaceholder="Search players…"
      items={sorted}
      itemKey={(r) => r.id}
      searchKeys={(r) => `${r.player} ${r.by}`}
      renderItem={(r) => (
        <RatingRow
          rating={r}
          onPress={() => {
            const pid = playerId(r.player);
            if (pid) router.push(`/player?id=${pid}`);
          }}
        />
      )}
      emptyText="No ratings match that search."
    />
  );
}

const styles = StyleSheet.create({
  avgChip: {
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  avgText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: Colors.mint,
  },
});
