import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Tactical } from '@/constants/tactical-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AiPlaceholderModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="robot-outline" size={26} color={Tactical.aiInk} />
          </View>

          <Text style={styles.title}>Gjenero me AI</Text>
          <Text style={styles.body}>
            Gjenerimi i ushtrimeve me AI është i disponueshëm vetëm në versionin web të
            GoalHub. Në aplikacion mund ta vizatosh ushtrimin manualisht në tavolinë
            taktike dhe ta ruash — ushtrimet shfaqen më pas në të dyja anët.
          </Text>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kuptoj"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Kuptoj</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,8,16,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: Tactical.panelSolid,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Tactical.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Tactical.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  body: {
    color: Tactical.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 28,
    borderRadius: 7,
    backgroundColor: Tactical.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Tactical.aiInk,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});
