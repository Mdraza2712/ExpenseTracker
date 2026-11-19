import axios from "axios";
import { FIREBASE_DATABASE_URL } from "../utils/firebase";
import { getAuth } from "firebase/auth";

const api = axios.create({
  baseURL: `${FIREBASE_DATABASE_URL}/`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();

    config.params = {
      ...(config.params || {}),
      auth: token,
    };
  }

  return config;
});

export default api;
