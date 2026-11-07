
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.text }}>Accueil</Text>

      {/* Bouton Mes annonces */}
      <Pressable
        onPress={() => navigation.navigate('MyListings')}
        style={{
          position: 'absolute',
          left: 20,
          bottom: 20,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: '700' }}>
          Mes annonces
        </Text>
      </Pressable>

      {/* Bouton Publier */}
      <Pressable
        onPress={() => navigation.navigate('Publish')}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 16,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>
          + Publier
        </Text>
      </Pressable>
    </View>
  );
}
