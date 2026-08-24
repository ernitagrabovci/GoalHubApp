import { StyleSheet, Text, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors, Fonts } from '@/constants/theme';
import { ALL_MESSAGES } from '@/lib/data';

export default function MessagesScreen() {
  const unread = ALL_MESSAGES.filter((m) => m.unread).length;

  return (
    <ListScreen
      icon="bubble.left.fill"
      accent="#408A71"
      title="messages"
      subtitle={unread ? `${unread} unread · coach & club` : 'coach & club · all read'}
      searchable
      searchPlaceholder="Search messages…"
      items={ALL_MESSAGES}
      itemKey={(m) => m.id}
      searchKeys={(m) => `${m.sender} ${m.preview}`}
      renderItem={(m) => (
        <ListRow
          title={m.sender}
          subtitle={m.preview}
          leading={<InitialsTile initials={m.initials} color={m.color} />}
          trailing={
            <View style={styles.trailing}>
              <Text style={styles.time}>{m.time}</Text>
              {m.unread ? <View style={styles.unreadDot} /> : <View style={styles.readDot} />}
            </View>
          }
          onPress={() => alert(`Conversation with ${m.sender} — coming soon`)}
        />
      )}
      actionLabel="new message"
      onAction={() => alert('New message — coming soon')}
    />
  );
}

const styles = StyleSheet.create({
  trailing: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
});
