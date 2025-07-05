// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDPje5xAHdZLgrLwianNB1HstWbWyLBqD0",
  authDomain: "zilzzz.firebaseapp.com",
  projectId: "zilzzz",
  storageBucket: "zilzzz.firebasestorage.app",
  messagingSenderId: "313206247942",
  appId: "1:313206247942:web:d5cff836164329cfd32987"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
