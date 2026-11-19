import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { store, persistor, hydrateFromServer } from "./store";
import AppNavigator from "./navigation/AppNavigator";

import { COLORS } from "./utils/theme";
import { requestNotificationPermissions } from "./utils/notifications";
import { onAuthStateChange } from "./utils/firebase";
import { setUser, clearUser } from "./store/slices/authSlice";

function LoadingView() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingInner}>
        <Text style={styles.loadingIcon}>💰</Text>
        <Text style={styles.loadingTitle}>ExpenseTracker</Text>

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 24 }}
        />
      </View>
    </View>
  );
}

function RootApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    requestNotificationPermissions();

    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        if (user) {
          store.dispatch(
            setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
            }),
          );

          await hydrateFromServer();
        } else {
          store.dispatch(clearUser());
        }
      } catch (e) {
        console.log("Auth Error:", e);
      } finally {
        setReady(true);
      }
    });

    return unsubscribe;
  }, []);

  if (!ready) {
    return <LoadingView />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <RootApp />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingInner: {
    alignItems: "center",
  },
  loadingIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  loadingTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
