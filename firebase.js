// firebase.js
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDPje5xAHdZLgrLwianNB1HstWbWyLBqD0",
  authDomain: "zilzzz.firebaseapp.com",
  projectId: "zilzzz",
  storageBucket: "zilzzz.appspot.com",
  messagingSenderId: "313206247942",
  appId: "1:313206247942:web:d5cff836164329cfd32987"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// ✅ Firestore DB
const db = getFirestore(app);

export { auth, db };
