import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLocation } from '../../src/context/LocationContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from '../../src/utils/toast';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { isTracking, stopTracking } = useLocation();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationPermission, setLocationPermission] = useState(true);
  const [logoutPending, setLogoutPending] = useState(false);
  const logoutConfirmTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (logoutConfirmTimeout.current) {
        clearTimeout(logoutConfirmTimeout.current);
      }
    };
  }, []);

  const handleSaveName = async () => {
    if (!newName.trim()) {
      showErrorToast('Invalid name', 'Name cannot be empty.');
      return;
    }

    try {
      // In a real app, you'd update the name on the backend
      showSuccessToast('Profile updated', 'Name updated successfully.');
      setEditingName(false);
    } catch (error) {
      showErrorToast('Error', 'Failed to update name.');
    }
  };

  const handleResetPassword = () => {
    showInfoToast('Reset password', 'A reset link will be sent to your email address.');
  };

  const handleLogout = async () => {
    if (!logoutPending) {
      setLogoutPending(true);
      showWarningToast('Confirm logout', 'Tap logout again to confirm.');
      if (logoutConfirmTimeout.current) {
        clearTimeout(logoutConfirmTimeout.current);
      }
      logoutConfirmTimeout.current = setTimeout(() => {
        setLogoutPending(false);
        logoutConfirmTimeout.current = null;
      }, 4000);
      return;
    }

    if (logoutConfirmTimeout.current) {
      clearTimeout(logoutConfirmTimeout.current);
      logoutConfirmTimeout.current = null;
    }

    setLogoutPending(false);

    if (isTracking) {
      await stopTracking();
    }
    await logout();
    showSuccessToast('Logged out', 'You have been signed out.');
  };

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }> = ({ icon, title, subtitle, rightComponent, onPress }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (onPress && <Icon name="chevron-right" size={24} color={theme.colors.secondary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={[styles.nameInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={newName}
                  onChangeText={setNewName}
                  onBlur={handleSaveName}
                  onSubmitEditing={handleSaveName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <Icon name="check" size={20} color={theme.colors.success} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameContainer}
                onPress={() => setEditingName(true)}
              >
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {user?.name}
                </Text>
                <Icon name="edit" size={16} color={theme.colors.secondary} />
              </TouchableOpacity>
            )}
            
            <Text style={[styles.profileEmail, { color: theme.colors.secondary }]}>
              {user?.email}
            </Text>
            
            <View style={[styles.roleBadge, { backgroundColor: user?.role === 'admin' ? theme.colors.warning : theme.colors.primary }]}>
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Super Admin' : 'User'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          
          <SettingItem
            icon="email"
            title="Email"
            subtitle={user?.email}
          />
          
          <SettingItem
            icon="phone"
            title="Phone"
            subtitle={user?.phone}
          />
          
          <SettingItem
            icon="lock"
            title="Reset Password"
            subtitle="Change your account password"
            onPress={handleResetPassword}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
          <SettingItem
            icon={isDark ? 'dark-mode' : 'light-mode'}
            title="Dark Mode"
            subtitle={isDark ? 'Enabled' : 'Disabled'}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={isDark ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive meeting updates"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem
            icon="location-on"
            title="Location Access"
            subtitle="Allow background location tracking"
            rightComponent={
              <Switch
                value={locationPermission}
                onValueChange={setLocationPermission}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={locationPermission ? '#fff' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Admin Features */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Admin Tools</Text>
            
            <SettingItem
              icon="people"
              title="Manage Users"
              subtitle="View and manage user accounts"
              onPress={() =>
                showInfoToast('Coming soon', 'User management feature is coming soon.')
              }
            />
            
            <SettingItem
              icon="analytics"
              title="Analytics"
              subtitle="View app usage statistics"
              onPress={() => showInfoToast('Coming soon', 'Analytics feature is coming soon.')}
            />
            
            <SettingItem
              icon="settings"
              title="App Settings"
              subtitle="Configure application settings"
              onPress={() => showInfoToast('Coming soon', 'App settings feature is coming soon.')}
            />
          </View>
        )}

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>App Info</Text>
          
          <SettingItem
            icon="info"
            title="About"
            subtitle="Version 1.0.0"
          />
          
          <SettingItem
            icon="help"
            title="Help & Support"
            subtitle="Get help using the app"
            onPress={() =>
              showInfoToast('Help', 'Contact support at help@locationtracker.com.')
            }
          />
          
          <SettingItem
            icon="privacy-tip"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() =>
              showInfoToast('Privacy Policy', 'Privacy policy details would be shown here.')
            }
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.secondary }]}>
            Location Tracker v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 4,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
  },
});

export default ProfileScreen;