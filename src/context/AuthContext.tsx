import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface User {
  id?: string;
  uid?: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  assignedCities?: string[];
  assignedAreas?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check hardcoded admin account
      if (email === 'admin@gmail.com' && password === 'admin') {
        const adminUser: User = {
          id: 'admin-001',
          email: 'admin@gmail.com',
          name: 'Super Admin',
          phone: '+1234567890',
          role: 'admin',
        };
        
        // Create admin user document in Firestore to ensure rules work
        try {
          await setDoc(doc(db, 'users', 'admin-001'), {
            _id: 'admin-001',
            name: 'Super Admin',
            email: 'admin@gmail.com',
            phone: '+1234567890',
            role: 'admin',
            created_at: new Date(),
            is_active: true,
          }, { merge: true });
          console.log('Admin user document created/updated in Firestore');
        } catch (error) {
          console.log('Admin user document already exists or error:', error);
        }
        
        await AsyncStorage.setItem('user', JSON.stringify(adminUser));
        setUser(adminUser);
        return true;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const udoc = await getDoc(doc(db, 'users', uid));
      if (!udoc.exists()) return false;
      const data = udoc.data() as any;
      const signedInUser: User = {
        id: data._id || uid,
        email: data.email || email,
        name: data.name || cred.user.displayName || '',
        phone: data.phone || '',
        role: data.role || 'user',
        assignedCities: data.assignedCities || data.assigned_cities || [],
      };
      await AsyncStorage.setItem('user', JSON.stringify(signedInUser));
      setUser(signedInUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      const uid = cred.user.uid;
      const userDoc = {
        _id: uid,
        name,
        email,
        phone,
        role: 'user',
        assignedCities: [],
        created_at: new Date(),
        is_active: true,
      };
      await setDoc(doc(db, 'users', uid), userDoc);
      const savedUser: User = { id: uid, name, email, phone, role: 'user', assignedCities: [] };
      await AsyncStorage.setItem('user', JSON.stringify(savedUser));
      setUser(savedUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthProvider;