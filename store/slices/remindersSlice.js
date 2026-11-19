import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  bills: [],
};

const remindersSlice = createSlice({
  name: "reminders",
  initialState,
  reducers: {
    addBill: (state, action) => {
      const exists = state.bills.find((bill) => bill.id === action.payload.id);

      if (!exists) {
        state.bills.push(action.payload);
      }
    },

    updateBill: (state, action) => {
      const index = state.bills.findIndex(
        (bill) => bill.id === action.payload.id,
      );

      if (index !== -1) {
        state.bills[index] = {
          ...state.bills[index],
          ...action.payload,
        };
      }
    },

    deleteBill: (state, action) => {
      state.bills = state.bills.filter((bill) => bill.id !== action.payload);
    },

    markBillPaid: (state, action) => {
      const bill = state.bills.find((bill) => bill.id === action.payload);

      if (bill) {
        bill.isPaid = true;
      }
    },

    setBills: (state, action) => {
      state.bills = action.payload || [];
    },

    clearBills: (state) => {
      state.bills = [];
    },
  },
});

export const {
  addBill,
  updateBill,
  deleteBill,
  markBillPaid,
  setBills,
  clearBills,
} = remindersSlice.actions;

export default remindersSlice.reducer;
