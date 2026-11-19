import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  persons: [],
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    // -------------------------
    // Expenses
    // -------------------------

    addExpense: (state, action) => {
      const exists = state.items.find((item) => item.id === action.payload.id);

      if (!exists) {
        state.items.push(action.payload);
      }
    },

    updateExpense: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
        };
      }
    },

    deleteExpense: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    settleExpense: (state, action) => {
      const { expenseId, personId } = action.payload;

      const expense = state.items.find((item) => item.id === expenseId);

      if (!expense) return;

      const split = expense.splits?.find((s) => s.personId === personId);

      if (split) {
        split.settled = true;
      }
    },

    setExpenses: (state, action) => {
      state.items = action.payload || [];
    },

    // -------------------------
    // Persons
    // -------------------------

    addPerson: (state, action) => {
      const exists = state.persons.find(
        (person) => person.id === action.payload.id,
      );

      if (!exists) {
        state.persons.push(action.payload);
      }
    },

    updatePerson: (state, action) => {
      const index = state.persons.findIndex(
        (person) => person.id === action.payload.id,
      );

      if (index !== -1) {
        state.persons[index] = {
          ...state.persons[index],
          ...action.payload,
        };
      }
    },

    deletePerson: (state, action) => {
      state.persons = state.persons.filter(
        (person) => person.id !== action.payload,
      );
    },

    setPersons: (state, action) => {
      state.persons = action.payload || [];
    },

    clearExpensesData: (state) => {
      state.items = [];
      state.persons = [];
    },
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  settleExpense,
  setExpenses,

  addPerson,
  updatePerson,
  deletePerson,
  setPersons,

  clearExpensesData,
} = expensesSlice.actions;

export default expensesSlice.reducer;
