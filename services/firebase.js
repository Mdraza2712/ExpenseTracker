import axios from "axios";
import { FIREBASE_DATABASE_URL, auth } from "../utils/firebase";
import { getStoredToken, clearStoredToken } from "../utils/tokenStorage";

export const client = axios.create({
  baseURL: FIREBASE_DATABASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearStoredToken();
    }

    return Promise.reject(error);
  },
);

export const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
  } catch (e) {
    console.log("Token Refresh Failed:", e);
  }

  return await getStoredToken();
};

const buildUrl = (path) => {
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanPath}.json`;
};

const request = async (path, options = {}) => {
  const token = await getAuthToken();

  const method = (options.method || "GET").toUpperCase();

  const config = {
    url: buildUrl(path),
    method,
    params: token ? { auth: token } : undefined,
  };

  if (options.body !== undefined) {
    config.data = options.body;
  }

  try {
    const response = await client.request(config);

    switch (method) {
      case "GET":
        if (!response.data) return [];

        return Object.entries(response.data).map(([id, value]) => ({
          id,
          ...value,
        }));

      case "POST":
        return {
          id: response.data.name,
          ...(config.data || {}),
        };

      case "PUT":
      case "PATCH":
        return config.data;

      case "DELETE":
        return true;

      default:
        return response.data;
    }
  } catch (error) {
    console.log("Firebase Error:", error.response?.data || error.message);

    throw new Error(
      error.response?.data?.error || error.message || "Firebase request failed",
    );
  }
};

export const firebaseService = {
  expenses: {
    list: (uid) => request(`users/${uid}/expenses`),

    create: (uid, data) =>
      request(`users/${uid}/expenses`, {
        method: "POST",
        body: data,
      }),

    update: (uid, id, data) =>
      request(`users/${uid}/expenses/${id}`, {
        method: "PUT",
        body: data,
      }),

    remove: (uid, id) =>
      request(`users/${uid}/expenses/${id}`, {
        method: "DELETE",
      }),
  },

  persons: {
    list: (uid) => request(`users/${uid}/persons`),

    create: (uid, data) =>
      request(`users/${uid}/persons`, {
        method: "POST",
        body: data,
      }),

    update: (uid, id, data) =>
      request(`users/${uid}/persons/${id}`, {
        method: "PUT",
        body: data,
      }),

    remove: (uid, id) =>
      request(`users/${uid}/persons/${id}`, {
        method: "DELETE",
      }),
  },

  work: {
    list: (uid) => request(`users/${uid}/work`),

    create: (uid, data) =>
      request(`users/${uid}/work`, {
        method: "POST",
        body: data,
      }),

    update: (uid, id, data) =>
      request(`users/${uid}/work/${id}`, {
        method: "PUT",
        body: data,
      }),

    remove: (uid, id) =>
      request(`users/${uid}/work/${id}`, {
        method: "DELETE",
      }),
  },

  reminders: {
    list: (uid) => request(`users/${uid}/reminders`),

    create: (uid, data) =>
      request(`users/${uid}/reminders`, {
        method: "POST",
        body: data,
      }),

    update: (uid, id, data) =>
      request(`users/${uid}/reminders/${id}`, {
        method: "PUT",
        body: data,
      }),

    remove: (uid, id) =>
      request(`users/${uid}/reminders/${id}`, {
        method: "DELETE",
      }),
  },
};
