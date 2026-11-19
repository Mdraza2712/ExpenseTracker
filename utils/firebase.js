import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import { setStoredToken, clearStoredToken } from "./tokenStorage";

const firebaseConfig = {
  apiKey: "AIzaSyAx77zDw9iVjppFkrezKDCr-GxxTGAzYig",
  authDomain: "expense-app-51dd2.firebaseapp.com",
  projectId: "expense-app-51dd2",
  storageBucket: "expense-app-51dd2.firebasestorage.app",
  messagingSenderId: "575885920449",
  appId: "1:575885920449:web:0e308e96b8b282c3cd6c40",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };

export const database = getDatabase(app);

// IMPORTANT: initialize Auth ONLY ONCE
let authInstance;

try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Auth was already initialized
  authInstance = app._auth || app.auth;
}

export const auth = authInstance;

export const FIREBASE_API_KEY = firebaseConfig.apiKey;

export const FIREBASE_AUTH_DOMAIN = firebaseConfig.authDomain;

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

export const FIREBASE_DATABASE_URL =
  "https://expense-app-51dd2-default-rtdb.firebaseio.com/";

export const FIREBASE_STORAGE_BUCKET = "expense-app-51dd2.appspot.com";

export const loginWithEmail = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const token = await credential.user.getIdToken();

  await setStoredToken(token);

  return credential.user;
};

export const registerWithEmail = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  if (displayName) {
    await updateProfile(credential.user, {
      displayName,
    });
  }

  const token = await credential.user.getIdToken();

  await setStoredToken(token);

  return credential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
  await clearStoredToken();
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { onAuthStateChanged };

export default app;
