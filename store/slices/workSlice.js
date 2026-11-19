import { createSlice } from "@reduxjs/toolkit";

const workSlice = createSlice({
  name: "work",
  initialState: {
    tasks: [],
  },

  reducers: {
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },

    updateTask: (state, action) => {
      if (!action.payload?.id) return;

      const index = state.tasks.findIndex(
        (task) => task.id === action.payload.id,
      );

      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload,
        };
      }
    },

    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },

    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;

      const allowed = ["pending", "in-progress", "completed", "cancelled"];

      if (!allowed.includes(status)) return;

      const task = state.tasks.find((task) => task.id === id);

      if (task) {
        task.status = status;
      }
    },

    setTasks: (state, action) => {
      state.tasks = Array.isArray(action.payload) ? action.payload : [];
    },

    clearTasks: (state) => {
      state.tasks = [];
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  setTasks,
  clearTasks,
} = workSlice.actions;

export default workSlice.reducer;
