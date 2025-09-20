import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '../src/utils/toast';

const SimpleLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const handleSubmit = async () => {
    const { email, password, name, phone } = formData;

    if (!email || !password) {
      showWarningToast('Missing information', 'Please enter both email and password.');
      return;
    }

    if (!isLogin && (!name || !phone)) {
      showWarningToast('Missing information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN LOGIC
        console.log('Attempting login...');
        
        // Check hardcoded admin account first
        if (email === 'admin@gmail.com' && password === 'admin') {
          const adminUser = {
            id: 'admin-001',
            name: 'Super Admin',
            email: 'admin@gmail.com',
            role: 'admin'
          };
          setLoggedInUser(adminUser);
          setLoggedIn(true);
          showSuccessToast('Welcome Super Admin!', 'You are logged in.');
          setLoading(false);
          return;
        }

        // Try backend API for regular users
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          setLoggedInUser(userData);
          setLoggedIn(true);
          showSuccessToast('Success', `Welcome ${userData.name}!`);
        } else {
          showErrorToast('Error', 'Invalid credentials. Please try again.');
        }
      } else {
        // REGISTER LOGIC
        console.log('Attempting registration...');
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phone, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          setLoggedInUser(userData);
          setLoggedIn(true);
          showSuccessToast('Account created', `Welcome ${userData.name}!`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          showErrorToast('Error', errorData.detail || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      showErrorToast(
        'Error',
        `${isLogin ? 'Login' : 'Registration'} failed. Please check your connection.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setLoggedInUser(null);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  if (loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✅ Welcome!</Text>
          <Text style={styles.successName}>{loggedInUser?.name}</Text>
          <Text style={styles.successRole}>
            {loggedInUser?.role === 'admin' ? 'Super Admin' : 'User'}
          </Text>
          <Text style={styles.successText}>
            You have successfully {isLogin ? 'logged in' : 'registered'} to Location Tracker!
          </Text>
          <Text style={styles.featureText}>
            🗺️ Maps with 5000+ organizations{'\n'}
            📅 Meeting scheduling & approval{'\n'}
            📍 Location tracking{'\n'}
            👥 User management (Admin)
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Location Tracker</Text>
        <Text style={styles.subtitle}>Track, Meet, Manage</Text>
        
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            editable={!loading}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              editable={!loading}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            editable={!loading}
            onSubmitEditing={handleSubmit}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
          
          {isLogin && (
            <View style={styles.adminNote}>
              <Text style={styles.adminNoteText}>
                Super Admin: admin@gmail.com / admin
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#000',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  adminNote: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  adminNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#007AFF',
  },
  successName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  successRole: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  featureText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
    lineHeight: 22,
  },
});

export default SimpleLogin;