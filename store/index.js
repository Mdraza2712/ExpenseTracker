import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import expensesReducer, {
  setExpenses,
  setPersons,
} from "./slices/expensesSlice";
import workReducer, { setTasks } from "./slices/workSlice";
import remindersReducer, { setBills } from "./slices/remindersSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "expenses", "work", "reminders"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  expenses: expensesReducer,
  work: workReducer,
  reminders: remindersReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/FLUSH",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
        ],
      },
    }),
});

export const persistor = persistStore(store);

export const hydrateFromServer = async (uid) => {
  if (!uid) return;

  try {
    const { firebaseService } = await import("../services/firebase");

    const [expenses, persons, tasks, bills] = await Promise.all([
      firebaseService.expenses.list(uid),
      firebaseService.persons.list(uid),
      firebaseService.work.list(uid),
      firebaseService.reminders.list(uid),
    ]);

    store.dispatch(setExpenses(expenses || []));
    store.dispatch(setPersons(persons || []));
    store.dispatch(setTasks(tasks || []));
    store.dispatch(setBills(bills || []));
  } catch (error) {
    console.error("Hydration Error:", error);
  }
};
