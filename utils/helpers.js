import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInDays,
  isValid,
} from "date-fns";
export const formatCurrency = (amount, currency = "₹") => {
  return `${currency}${parseFloat(amount || 0).toFixed(2)}`;
};

export const formatDate = (date) => {
  if (!date) return "--";

  const d = new Date(date);

  if (!isValid(d)) return "--";

  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isTomorrow(d)) return "Tomorrow";

  return format(d, "dd MMM yyyy");
};

export const formatDateFull = (date) => {
  if (!date) return "--";

  const d = new Date(date);

  if (!isValid(d)) return "--";

  return format(d, "dd MMM yyyy, hh:mm a");
};

export const getDaysUntil = (date) => {
  if (!date) return 9999;

  const d = new Date(date);

  if (!isValid(d)) return 9999;

  return differenceInDays(d, new Date());
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const groupExpensesByDate = (expenses) => {
  const grouped = {};
  expenses.forEach((expense) => {
    const d = new Date(expense.date);

    if (!isValid(d)) return;

    const dateKey = format(d, "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(expense);
  });
  return grouped;
};

export const calculateSplitAmount = (total, participants) => {
  if (!participants || participants.length === 0) return 0;
  return total / participants.length;
};

// export const getBalanceSummary = (expenses, persons) => {
//   const balances = {};
//   persons.forEach((p) => {
//     balances[p.id] = { person: p, owes: 0, owed: 0, net: 0 };
//   });

//   expenses.forEach((expense) => {
//     if (!expense.splits || expense.splits.length === 0) return;
//     const payerId = expense.paidBy;
//     expense.splits.forEach((split) => {
//       if (split.personId !== payerId) {
//         if (balances[split.personId]) {
//           balances[split.personId].owes += split.amount;
//         }
//         if (balances[payerId]) {
//           balances[payerId].owed += split.amount;
//         }
//       }
//     });
//   });

//   Object.keys(balances).forEach((id) => {
//     balances[id].net = balances[id].owed - balances[id].owes;
//   });

//   return Object.values(balances);
// };

export const getBalanceSummary = (expenses, persons) => {
  const balances = {};

  persons.forEach((person) => {
    balances[person.id] = {
      person,
      owes: 0,
      owed: 0,
      net: 0,
    };
  });

  expenses.forEach((expense) => {
    if (!expense?.splits?.length) return;

    const payerId = expense.paidBy;

    // payer deleted
    if (!balances[payerId]) return;

    expense.splits.forEach((split) => {
      // participant deleted
      if (!balances[split.personId]) return;

      // payer doesn't owe himself
      if (split.personId === payerId) return;

      // already settled
      if (split.settled) return;

      const amount = Number(split.amount) || 0;

      balances[split.personId].owes += amount;
      balances[payerId].owed += amount;
    });
  });

  Object.values(balances).forEach((balance) => {
    balance.net = balance.owed - balance.owes;
  });

  return Object.values(balances);
};

export const WORK_STATUS_COLORS = {
  pending: "#FF9A3C",
  "in-progress": "#6C63FF",
  completed: "#43E97B",
  cancelled: "#FF6584",
};

export const PRIORITY_COLORS = {
  low: "#43E97B",
  medium: "#FF9A3C",
  high: "#FF6584",
};

export const generateExpenseCSV = (expenses, persons) => {
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Paid By",
    "Split Details",
    "Status",
  ];
  const rows = expenses.map((e) => {
    const date = formatDateFull(e.date);
    const splitDetails =
      e.splits && e.splits.length > 0
        ? e.splits
            .map(
              (s) =>
                `${s.personName}: ${formatCurrency(s.amount)}${s.settled ? " (Settled)" : ""}`,
            )
            .join("; ")
        : "N/A";
    const hasUnsettled = e.splits && e.splits.some((s) => !s.settled);
    const status =
      e.splits && e.splits.length > 0
        ? hasUnsettled
          ? "Partially Settled"
          : "Fully Settled"
        : "N/A";
    return [
      date,
      e.description,
      e.category,
      formatCurrency(e.amount),
      e.paidByName || "N/A",
      splitDetails,
      status,
    ];
  });
  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
};

export const generateExpenseHTML = (expenses, persons, total) => {
  const rows = expenses
    .map(
      (e) => `
    <tr>
      <td>${formatDateFull(e.date)}</td>
      <td>${e.description}</td>
      <td>${e.category}</td>
      <td>${formatCurrency(e.amount)}</td>
      <td>${e.paidByName || "N/A"}</td>
      <td>${
        e.splits && e.splits.length > 0
          ? e.splits
              .map(
                (s) =>
                  `${s.personName}: ${formatCurrency(s.amount)}${s.settled ? " (Settled)" : ""}`,
              )
              .join("<br>")
          : "N/A"
      }</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Expense Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #6C63FF; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
    th { background-color: #6C63FF; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .total { margin-top: 20px; font-size: 18px; font-weight: bold; color: #6C63FF; }
  </style>
</head>
<body>
  <h1>Expense Report</h1>
  <p>Generated on ${formatDateFull(new Date())}</p>
  <table>
    <thead>
      <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Paid By</th><th>Split Details</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Total: ${formatCurrency(total)}</p>
</body>
</html>`;
};

export const generateTaskCSV = (tasks) => {
  const headers = [
    "Title",
    "Description",
    "Status",
    "Priority",
    "Due Date",
    "Assignees",
  ];
  const rows = tasks.map((t) => {
    const assignees =
      t.assignees && t.assignees.length > 0
        ? t.assignees.map((a) => a.name).join("; ")
        : t.assigneeName || "Unassigned";
    return [
      t.title,
      t.description,
      t.status,
      t.priority,
      formatDateFull(t.dueDate),
      assignees,
    ];
  });
  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
};

export const generateTaskHTML = (tasks) => {
  const rows = tasks
    .map(
      (t) => `
    <tr>
      <td>${t.title}</td>
      <td>${t.description}</td>
      <td>${t.status}</td>
      <td>${t.priority}</td>
      <td>${formatDateFull(t.dueDate)}</td>
      <td>${
        t.assignees && t.assignees.length > 0
          ? t.assignees.map((a) => a.name).join(", ")
          : t.assigneeName || "Unassigned"
      }</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Schedule Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #6C63FF; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
    th { background-color: #6C63FF; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Work Schedule Report</h1>
  <p>Generated on ${formatDateFull(new Date())}</p>
  <table>
    <thead>
      <tr><th>Title</th><th>Description</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Assignees</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
};
