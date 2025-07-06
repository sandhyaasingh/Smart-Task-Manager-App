import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';
import LoginScreen from './LoginScreen';
import TaskScreen from './TaskScreen';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔔 Ask for notification permission
  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission for notifications not granted 😞');
      }
    };
    registerForPushNotifications();
  }, []);

  // 🔐 Set Firebase auth persistence and track login state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Ensure user stays logged in across restarts
        await setPersistence(auth, browserLocalPersistence);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Failed to set auth persistence:', err);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1e1e1e',
        }}
      >
        <ActivityIndicator size="large" color="#ffb6c1" />
      </View>
    );
  }

  return user ? (
    <TaskScreen />
  ) : (
    <LoginScreen onLogin={() => setUser(auth.currentUser)} />
  );
}
