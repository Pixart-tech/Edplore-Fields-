import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyB8UmAVqH2tRvvhqG_usBK1hx2AC6iPTNY",
  authDomain: "edplore-fields.firebaseapp.com",
  projectId: "edplore-fields",
  storageBucket: "edplore-fields.appspot.com",
  messagingSenderId: "249375824852",
  appId: "1:249375824852:android:9a60b21a2da53d7d549441"
};

const app = initializeApp(firebaseConfig);

// Firestore works the same across platforms
export const db = getFirestore(app);

// Auth setup for both web + native
export const auth =
  Platform.OS === "web"
    ? getAuth(app) // ✅ Web uses default browser persistence
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage), // ✅ Native persistence
      });
