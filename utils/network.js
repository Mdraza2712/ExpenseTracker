import * as Network from "expo-network";

export const getNetworkState = async () => {
  try {
    const state = await Network.getNetworkStateAsync();

    return {
      isConnected: Boolean(state.isConnected),
      isInternetReachable:
        state.isInternetReachable ?? state.isConnected ?? false,
    };
  } catch (error) {
    console.warn("Network Error:", error);

    return {
      isConnected: false,
      isInternetReachable: false,
    };
  }
};

export const listenNetwork = (callback) => {
  // Send current state immediately
  getNetworkState().then(callback);

  // Listen for future changes
  const subscription = Network.addNetworkStateListener((state) => {
    callback({
      isConnected: Boolean(state.isConnected),
      isInternetReachable:
        state.isInternetReachable ?? state.isConnected ?? false,
    });
  });

  // Return unsubscribe function
  return () => {
    subscription?.remove?.();
  };
};
