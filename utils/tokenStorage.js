import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth:token';

export const setStoredToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage failures
  }
};

export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearStoredToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
};
