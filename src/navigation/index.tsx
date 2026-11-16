
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { colors } from '../theme';
import { RootStackParamList, TabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import PublishScreen from '../screens/PublishScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import MyListingsScreen from '../screens/MyListingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const icons: Record<keyof TabParamList, [string, string]> = {
  Accueil: ['home', 'home-outline'],
  Carte: ['map', 'map-outline'],
  Favoris: ['heart', 'heart-outline'],
  Messages: ['chatbubble', 'chatbubble-outline'],
  Profil: ['person', 'person-outline'],
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [on, off] = icons[route.name];
          return (
            <Ionicons
              name={(focused ? on : off) as any}
              size={size - 1}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Carte" component={MapScreen} />
      <Tab.Screen name="Favoris" component={FavoritesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.canvas,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const stackOptions = {
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerStyle: { backgroundColor: colors.canvas },
  headerBackTitle: 'Retour',
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Connexion' }}
        />

        <Stack.Screen
          name="Publish"
          component={PublishScreen}
          options={{ title: 'Publier une annonce' }}
        />

        <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: 'Mes annonces' }} />

        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: '', headerTransparent: true, headerTintColor: '#fff' }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Conversation' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
