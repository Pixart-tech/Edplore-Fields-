import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

// Import screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MapsScreen from './screens/MapsScreen';
import MeetingsScreen from './screens/MeetingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LocationProvider } from '../src/context/LocationContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import toastConfig from '../src/utils/toastConfig';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Maps':
              iconName = 'map';
              break;
            case 'Meetings':
              iconName = 'event';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Meetings" component={MeetingsScreen} />
      {user?.role === 'admin' && (
        <Tab.Screen 
          name="Admin" 
          component={require('./screens/AdminAssignmentScreen').default}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Icon name="admin-panel-settings" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <AppNavigator />
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}