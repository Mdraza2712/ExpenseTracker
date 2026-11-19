import api from "./api";

// Create Expense
export const addExpenseApi = async (uid, expense) => {
  const response = await api.post(`/users/${uid}/expenses.json`, expense);
  return response.data;
};

// Get Expenses
export const getExpensesApi = async (uid) => {
  const response = await api.get(`/users/${uid}/expenses.json`);
  return response.data;
};

// Update Expense
export const updateExpenseApi = async (uid, id, expense) => {
  await api.patch(`/users/${uid}/expenses/${id}.json`, expense);
};

// Delete Expense
export const deleteExpenseApi = async (uid, id) => {
  await api.delete(`/users/${uid}/expenses/${id}.json`);
};
