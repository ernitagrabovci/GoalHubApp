import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { DateTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { TONE_COLORS } from '@/components/status-chip';
import { Colors, Fonts } from '@/constants/theme';
import { ALL_TRAININGS } from '@/lib/data';

export default function TrainingsScreen() {
  const router = useRouter();
  return (
    <ListScreen
      icon="calendar"
      accent="#B0E4CC"
      title="trainings"
      subtitle={`${ALL_TRAININGS.length} this week · attendance tracked`}
      searchable
      searchPlaceholder="Search by type or field…"
      items={ALL_TRAININGS}
      itemKey={(t) => t.id}
      searchKeys={(t) => `${t.type} ${t.field}`}
      renderItem={(t) => {
        const color = TONE_COLORS[t.tone];
        return (
          <ListRow
            title={`${t.type} training`}
            subtitle={`${t.field} · ${t.time}`}
            leading={<DateTile day={t.day} month={t.month} color={color} />}
            trailing={
              <View style={styles.presence}>
                <IconSymbol name="person.2.fill" size={16} color={color} />
                <Text style={[styles.presenceText, { color }]}>
                  {t.present}/{t.total}
                </Text>
              </View>
            }
            onPress={() => router.push(`/training?id=${t.id}`)}
          />
        );
      }}
      actionLabel="new training"
      onAction={() => alert('New training — coming soon')}
    />
  );
}

const styles = StyleSheet.create({
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presenceText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
});
