import { View, Text } from 'react-native';
import { colors } from '../theme';

export default function PublishScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Publier une annonce</Text>
    </View>
  );
}