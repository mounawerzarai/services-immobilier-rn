import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

export default function ListingDetailScreen({ route, navigation }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Annonce {route.params.id}</Text>
      <Button title="Retour" onPress={() => navigation.goBack()} color={colors.primary} />
    </View>
  );
}