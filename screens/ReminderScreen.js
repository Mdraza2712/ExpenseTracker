import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  FlatList,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addBill,
  updateBill,
  deleteBill,
  markBillPaid,
} from "../store/slices/remindersSlice";
import { addExpense } from "../store/slices/expensesSlice";
import { COLORS, SIZES, SHADOWS } from "../utils/theme";
import { formatDate, getDaysUntil, formatCurrency } from "../utils/helpers";
import {
  Card,
  Button,
  Input,
  Badge,
  EmptyState,
  Avatar,
} from "../components/UIComponents";
import {
  requestNotificationPermissions,
  scheduleBillNotification,
  cancelNotification,
} from "../utils/notifications";
import { firebaseService } from "../services/firebaseService";
import { auth } from "../utils/firebase";

const BILL_CATEGORIES = [
  "Utilities",
  "Rent",
  "Insurance",
  "Subscription",
  "Loan",
  "Credit Card",
  "Internet",
  "Phone",
  "Other",
];
const RECURRENCE = ["none", "weekly", "monthly", "yearly"];

function AddBillModal({ visible, onClose, editBill }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  const [reminderDays, setReminderDays] = useState("3");
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [errors, setErrors] = useState({
    name: "",
    amount: "",
    dueDate: "",
    reminderDays: "",
  });

  useEffect(() => {
    if (visible) {
      if (editBill) {
        setName(editBill.name || "");
        setAmount(String(editBill.amount || ""));
        setCategory(editBill.category || "Utilities");
        setIsRecurring(editBill.isRecurring || false);
        setRecurringInterval(editBill.recurringInterval || "monthly");
        setReminderDays(String(editBill.reminderDays || "3"));
        setNotes(editBill.notes || "");
        if (editBill?.dueDate) {
          const date = new Date(editBill.dueDate);

          setSelectedDate(date);

          setDueDate(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          );
        }
      } else {
        setName("");
        setAmount("");
        setSelectedDate(new Date());
        setDueDate("");
        setCategory("Utilities");
        setIsRecurring(false);
        setRecurringInterval("monthly");
        setReminderDays("3");
        setNotes("");
      }
    }
  }, [visible, editBill]);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);

    if (!date) return;

    setSelectedDate(date);

    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    setDueDate(formatted);

    setErrors((prev) => ({
      ...prev,
      dueDate: "",
    }));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedAmount = amount.trim();
    const trimmedReminderDays = reminderDays.trim();

    if (!trimmedName) {
      return Alert.alert("Validation Error", "Please enter a bill name.");
    }

    const amountValue = Number(trimmedAmount);

    if (!trimmedAmount) {
      return Alert.alert("Validation Error", "Please enter the bill amount.");
    }

    if (isNaN(amountValue) || amountValue <= 0) {
      return Alert.alert("Validation Error", "Amount must be greater than 0.");
    }

    if (!dueDate) {
      return Alert.alert("Validation Error", "Please select a due date.");
    }

    const parsedDate = selectedDate;

    const reminderValue = Number(trimmedReminderDays);

    if (isNaN(reminderValue) || reminderValue < 0 || reminderValue > 365) {
      return Alert.alert(
        "Validation Error",
        "Reminder days must be between 0 and 365.",
      );
    }

    const payload = {
      name: trimmedName,
      amount: amountValue,
      dueDate: parsedDate.toISOString(),
      category,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null,
      reminderDays: reminderValue,
      notes: notes.trim(),
      isPaid: false,
    };
    const hasPermission = await requestNotificationPermissions();

    if (editBill) {
      if (editBill.notificationId)
        await cancelNotification(editBill.notificationId);
      let notificationId = null;
      if (hasPermission)
        notificationId = await scheduleBillNotification({
          ...payload,
          id: editBill.id,
        });
      try {
        const uid = auth.currentUser.uid;

        await firebaseService.reminders.update(uid, editBill.id, {
          ...editBill,
          ...payload,
          notificationId,
        });

        dispatch(
          updateBill({
            ...editBill,
            ...payload,
            notificationId,
          }),
        );
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    } else {
      let notificationId = null;
      const tempId = Date.now().toString();
      if (hasPermission)
        notificationId = await scheduleBillNotification({
          ...payload,
          id: tempId,
        });
      try {
        const uid = auth.currentUser.uid;

        const bill = await firebaseService.reminders.create(uid, {
          ...payload,
          notificationId,
        });

        dispatch(addBill(bill));
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editBill ? "Edit Bill" : "New Bill Reminder"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Input
              label="Bill Name"
              placeholder="e.g. Electricity Bill"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label="Amount (₹)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={errors.amount}
            />
            {/* <Input
              label="Due Date (YYYY-MM-DD)"
              placeholder="2026-03-26"
              value={dueDate}
              onChangeText={setDueDate}
              error={errors.dueDate}
            /> */}
            <View style={{ marginBottom: SIZES.md }}>
              <Text style={styles.fieldLabel}>Due Date</Text>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={{
                    color: dueDate ? COLORS.text : COLORS.textMuted,
                    fontSize: 15,
                  }}
                >
                  {dueDate || "Select Due Date"}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {!!errors.dueDate && (
                <Text style={styles.inputErrorText}>{errors.dueDate}</Text>
              )}
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: SIZES.md }}
            >
              {BILL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    category === cat && styles.catChipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === cat && styles.catChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Recurring Bill</Text>
                <Text style={styles.toggleSubLabel}>
                  Auto-advance due date after payment
                </Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: COLORS.surfaceLight,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.white}
              />
            </View>

            {isRecurring && (
              <>
                <Text style={styles.fieldLabel}>Repeat Interval</Text>
                <View style={styles.rowChips}>
                  {RECURRENCE.filter((r) => r !== "none").map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.recurrenceChip,
                        recurringInterval === r &&
                          styles.recurrenceChipSelected,
                      ]}
                      onPress={() => setRecurringInterval(r)}
                    >
                      <Text
                        style={[
                          styles.recurrenceText,
                          recurringInterval === r && { color: COLORS.white },
                        ]}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Input
              label="Remind me (days before)"
              placeholder="3"
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="number-pad"
              error={errors.reminderDays}
            />
            <Input
              label="Notes (optional)"
              placeholder="Any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ height: 64, textAlignVertical: "top" }}
            />

            <Button
              title={editBill ? "Update Bill" : "Add Bill"}
              onPress={handleSubmit}
              style={{ marginTop: 8 }}
            />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
    </Modal>
  );
}

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const bills = useSelector((s) => s.reminders.bills);
  const persons = useSelector((s) => s.expenses.persons);
  const [showAdd, setShowAdd] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [payerBill, setPayerBill] = useState(null);

  const { upcoming, overdue, paid, total } = useMemo(() => {
    const upcoming = bills.filter(
      (b) => !b.isPaid && getDaysUntil(b.dueDate) >= 0,
    );
    const overdue = bills.filter(
      (b) => !b.isPaid && getDaysUntil(b.dueDate) < 0,
    );
    const paid = bills.filter((b) => b.isPaid);
    const total = bills
      .filter((b) => !b.isPaid)
      .reduce((s, b) => s + parseFloat(b.amount || 0), 0);
    return { upcoming, overdue, paid, total };
  }, [bills]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "overdue":
        return overdue;
      case "paid":
        return paid;
      default:
        return [...overdue, ...upcoming].sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
        );
    }
  }, [filter, upcoming, overdue, paid]);

  const handleDelete = (bill) => {
    Alert.alert("Delete Bill", "This will also cancel the notification.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (bill.notificationId)
            await cancelNotification(bill.notificationId);
          try {
            const uid = auth.currentUser.uid;

            await firebaseService.reminders.remove(uid, bill.id);

            dispatch(deleteBill(bill.id));
          } catch (err) {
            Alert.alert("Delete Failed", err.message);
          }
        },
      },
    ]);
  };

  const handleMarkPaid = (bill) => {
    if (bill.isPaid) {
      Alert.alert(
        "Already Paid",
        "This bill has already been marked as paid and added as an expense.",
      );
      return;
    }
    if (persons.length === 0) {
      Alert.alert(
        "No Persons",
        "Please add people in the Persons tab before marking bills as paid.",
      );
      return;
    }
    if (persons.length === 1) {
      payBill(bill, persons[0]);
      return;
    }
    setPayerBill(bill);
  };

  const payBill = (bill, payer) => {
    setPayerBill(null);
dispatch(markBillPaid(bill.id));

const uid = auth.currentUser.uid;

await firebaseService.reminders.update(uid, bill.id, {
  ...bill,
  isPaid: true,
});
    const amount = Number(bill.amount);

    const perPerson = amount / persons.length;
    const splits = persons
      .filter((person) => person.id !== payer.id)
      .map((person) => ({
        personId: person.id,
        personName: person.name,
        amount: perPerson,
        settled: false,
      }));
    dispatch(
      addExpense({
        description: bill.name,
        amount: parseFloat(bill.amount || 0),
        category: bill.category,
        paidBy: payer.id,
        paidByName: payer.name,
        date: new Date().toISOString(),
        splits,
        splitType: "equal",
      }),
    );
   
  };

  const getBillStatusInfo = (bill) => {
    const days = getDaysUntil(bill.dueDate);
    if (bill.isPaid) return { label: "Paid", color: COLORS.accent };
    if (days < 0)
      return { label: `${Math.abs(days)}d overdue`, color: COLORS.danger };
    if (days === 0) return { label: "Due Today!", color: COLORS.accentOrange };
    if (days <= 3)
      return { label: `${days}d left`, color: COLORS.accentOrange };
    return { label: `${days}d left`, color: COLORS.textSecondary };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Bill Reminders</Text>
          <Text style={styles.totalDue}>{formatCurrency(total)} due</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditBill(null);
            setShowAdd(true);
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.summaryRow, { maxHeight: 100 }]}
      >
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={styles.summaryValue}>{overdue.length}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View
          style={[styles.summaryCard, { borderLeftColor: COLORS.accentOrange }]}
        >
          <Text style={styles.summaryValue}>
            {upcoming.filter((b) => getDaysUntil(b.dueDate) <= 7).length}
          </Text>
          <Text style={styles.summaryLabel}>Due this week</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.accent }]}>
          <Text style={styles.summaryValue}>{paid.length}</Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.primary }]}>
          <Text style={styles.summaryValue}>{upcoming.length}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
      </ScrollView>

      {/* Filter */}
      <View style={{ flex: 12 }}>
        <View style={styles.filterRow}>
          {[
            ["upcoming", "Upcoming"],
            ["overdue", "Overdue"],
            ["paid", "Paid"],
          ].map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.filterBtn,
                filter === val && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(val)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filter === val && styles.filterBtnTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No bills here"
            subtitle="Add bill reminders to stay on top of your payments and never miss a due date"
            action={() => setShowAdd(true)}
            actionLabel="Add Bill"
          />
        ) : (
          <View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const { label, color } = getBillStatusInfo(item);
                const days = getDaysUntil(item.dueDate);
                const isOverdue = !item.isPaid && days < 0;
                return (
                  <Card
                    style={[
                      styles.billCard,
                      isOverdue && styles.billCardOverdue,
                    ]}
                  >
                    <View style={styles.billTop}>
                      <View
                        style={[
                          styles.billIconWrap,
                          { backgroundColor: color + "20" },
                        ]}
                      >
                        <Ionicons name="receipt" size={20} color={color} />
                      </View>
                      <View style={styles.billInfo}>
                        <Text style={styles.billName}>{item.name}</Text>
                        <Text style={styles.billCategory}>
                          {item.category}
                          {item.isRecurring
                            ? ` · 🔁 ${item.recurringInterval}`
                            : ""}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.billNotes} numberOfLines={1}>
                            {item.notes}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.billRight}>
                        <Text style={styles.billAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <Badge label={label} color={color} />
                      </View>
                    </View>

                    <View style={styles.billMeta}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.billDueDate}>
                        {formatDate(item.dueDate)}
                      </Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Ionicons
                        name="notifications-outline"
                        size={13}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.billDueDate}>
                        {item.reminderDays || 3}d before
                      </Text>
                      <View style={{ flex: 1 }} />
                      {!item.isPaid && (
                        <TouchableOpacity
                          style={styles.paidBtn}
                          onPress={() => handleMarkPaid(item)}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={15}
                            color={COLORS.accent}
                          />
                          <Text style={styles.paidBtnText}>Mark Paid</Text>
                        </TouchableOpacity>
                      )}
                      {!item.isPaid && (
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => {
                            setEditBill(item);
                            setShowAdd(true);
                          }}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={15}
                            color={COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                      {!item.isPaid && (
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleDelete(item)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={15}
                            color={COLORS.danger}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                );
              }}
            />
          </View>
        )}
      </View>

      <AddBillModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditBill(null);
        }}
        editBill={editBill}
      />

      {payerBill && (
        <Modal visible animationType="fade" transparent>
          <TouchableOpacity
            style={styles.payerOverlay}
            activeOpacity={1}
            onPress={() => setPayerBill(null)}
          >
            <View style={styles.payerModal}>
              <Text style={styles.payerTitle}>Who paid {payerBill.name}?</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {persons.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.payerOption}
                    onPress={() => payBill(payerBill, p)}
                  >
                    <Avatar
                      name={p.name}
                      size={32}
                      color={p.color || COLORS.primary}
                    />
                    <Text style={styles.payerName}>{p.name}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  dateInput: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: SIZES.borderRadiusSm,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  screenTitle: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  totalDue: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  summaryRow: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    maxWidth: 100,
    margin: 4,
  },
  summaryValue: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadiusSm,
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  filterBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  filterBtnTextActive: { color: COLORS.primary, fontWeight: "600" },
  list: { padding: SIZES.md, gap: SIZES.sm },
  billCard: { marginBottom: 2 },
  billCardOverdue: { borderColor: COLORS.danger + "50" },
  billTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  billIconWrap: {
    width: 48,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  billInfo: { flex: 1 },
  billName: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  billCategory: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  billNotes: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  billRight: { alignItems: "flex-end", gap: 4 },
  billAmount: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  billMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  billDueDate: { color: COLORS.textMuted, fontSize: 12 },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  paidBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.accent + "15",
  },
  paidBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: "600" },
  editBtn: { padding: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.md,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  catChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: { color: COLORS.textSecondary, fontSize: 13 },
  catChipTextSelected: { color: COLORS.white },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
    padding: SIZES.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.borderRadiusSm,
  },
  toggleLabel: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  toggleSubLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  rowChips: { flexDirection: "row", gap: 8, marginBottom: SIZES.md },
  recurrenceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  recurrenceChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  recurrenceText: { color: COLORS.textSecondary, fontSize: 13 },
  payerOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.md,
  },
  payerModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.md,
    width: "100%",
    maxWidth: 360,
  },
  payerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: SIZES.md,
    textAlign: "center",
  },
  payerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: SIZES.borderRadiusSm,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 8,
  },
  payerName: { color: COLORS.text, fontSize: 14, fontWeight: "500", flex: 1 },
});
