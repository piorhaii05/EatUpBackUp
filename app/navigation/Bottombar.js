import { Entypo, Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import ContactScreen from '../comps/ContactScreen';
import FavoriteScreen from '../comps/FavoriteScreen';
import HomeScreen from '../comps/HomeScreen';
import ProfileScreen from '../comps/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '500' },
        tabBarActiveTintColor: '#f55',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          let icon;
          if (route.name === 'HomeRes') icon = <Entypo name="home" size={20} color={focused ? '#f55' : color} />;
          if (route.name === 'Favorite') icon = <Feather name="heart" size={20} color={focused ? '#f55' : color} />;
          if (route.name === 'Contact') icon = <Feather name="message-circle" size={20} color={focused ? '#f55' : color} />;
          if (route.name === 'Profile') icon = <Feather name="user" size={20} color={focused ? '#f55' : color} />;

          return (
            <View style={{
              backgroundColor: focused ? '#fde4e4' : 'transparent',
              padding: 8,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 40,
              minHeight: 40,
            }}>
              {icon}
            </View>
          );
        }
      })}
    >

      <Tab.Screen name="HomeRes" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Favorite" component={FavoriteScreen} options={{ tabBarLabel: 'Yêu thích' }} />
      <Tab.Screen name="Contact" component={ContactScreen} options={{ tabBarLabel: 'Liên hệ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Tôi' }} />
    </Tab.Navigator>
  );
}
