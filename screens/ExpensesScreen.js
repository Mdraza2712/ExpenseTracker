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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import {
  addExpenseApi,
  getExpensesApi,
  deleteExpenseApi,
  updateExpenseApi,
} from "../services/expenseApi";

import {
  addExpense,
  deleteExpense,
  settleExpense,
} from "../store/slices/expensesSlice";
import {
  COLORS,
  SIZES,
  SHADOWS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "../utils/theme";
import {
  formatCurrency,
  formatDate,
  formatDateFull,
  generateExpenseCSV,
  generateExpenseHTML,
} from "../utils/helpers";
import {
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  Chip,
  EmptyState,
  SectionHeader,
} from "../components/UIComponents";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Rent",
  "Travel",
  "Education",
  "Other",
];

function AddExpenseModal({ visible, onClose, persons }) {
  const dispatch = useDispatch();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paidBy, setPaidBy] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [date, setDate] = useState(new Date().toISOString());
  const uid = useSelector((state) => state.auth.user?.uid);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const data = await getExpensesApi(uid);

        if (!data) return;

        const expenses = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));

        dispatch(setExpenses(expenses));
      } catch (error) {
        console.log(error);
      }
    };

    if (uid) {
      loadExpenses();
    }
  }, [uid]);

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategory("Food");
    setPaidBy("");
    setSelectedParticipants([]);
    setSplitType("equal");
    setCustomSplits({});
    setDate(new Date().toISOString());
  };

  const toggleParticipant = (id) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    // Description
    if (!description.trim()) {
      return Alert.alert("Error", "Please enter a description");
    }

    // Amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return Alert.alert("Error", "Please enter a valid amount");
    }

    // Paid By
    if (!paidBy) {
      return Alert.alert("Error", "Please select who paid");
    }

    // Participants
    if (selectedParticipants.length === 0) {
      return Alert.alert("Error", "Please select at least one participant");
    }

    // Paid By must be included in participants
    if (!selectedParticipants.includes(paidBy)) {
      return Alert.alert(
        "Error",
        "The person who paid must be included in the split participants.",
      );
    }

    const totalAmount = parseFloat(amount);
    let splits = [];

    if (splitType === "equal") {
      const perPerson = totalAmount / selectedParticipants.length;

      splits = selectedParticipants.map((pid) => {
        const person = persons.find((p) => p.id === pid);

        return {
          personId: pid,
          personName: person?.name || "",
          amount: perPerson,
          settled: pid === paidBy,
        };
      });
    } else {
      // Validate custom splits
      let totalSplit = 0;

      for (const pid of selectedParticipants) {
        const value = parseFloat(customSplits[pid]);

        if (isNaN(value) || value < 0) {
          const person = persons.find((p) => p.id === pid);

          return Alert.alert(
            "Error",
            `Please enter a valid share for ${person?.name}.`,
          );
        }

        totalSplit += value;
      }

      // Total should equal expense amount
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        return Alert.alert(
          "Error",
          `Custom split total (₹${totalSplit.toFixed(
            2,
          )}) must equal expense amount (₹${totalAmount.toFixed(2)}).`,
        );
      }

      splits = selectedParticipants.map((pid) => {
        const person = persons.find((p) => p.id === pid);

        return {
          personId: pid,
          personName: person?.name || "",
          amount: parseFloat(customSplits[pid]),
          settled: pid === paidBy,
        };
      });
    }

    const paidByPerson = persons.find((p) => p.id === paidBy);

    const payload = {
      description: description.trim(),
      amount: totalAmount,
      category,
      paidBy,
      paidByName: paidByPerson?.name || "",
      date,
      splits,
      splitType,
    };

    try {
      const result = await addExpenseApi(uid, payload);

      dispatch(
        addExpense({
          id: result.name, // Firebase generated key
          ...payload,
        }),
      );

      Alert.alert("Success", "Expense added successfully.");

      reset();
      onClose();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to save expense.");
    }

    reset();
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Description"
              placeholder="What was this for?"
              value={description}
              onChangeText={(text) =>
                setDescription(text.replace(/[^a-zA-Z\s]/g, "").slice(0, 50))
              }
              maxLength={50}
              keyboardType="default"
            />
            <Input
              label="Amount (₹)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={10}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  color={CATEGORY_COLORS[cat]}
                />
              ))}
            </ScrollView>

            {persons.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Paid By</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipRow}
                >
                  {persons.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.personChip,
                        paidBy === p.id && styles.personChipSelected,
                      ]}
                      onPress={() => setPaidBy(p.id)}
                    >
                      <Avatar
                        name={p.name}
                        size={28}
                        color={p.color || COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.personChipText,
                          paidBy === p.id && styles.personChipTextSelected,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Split Between</Text>
                <View style={styles.participantsList}>
                  {persons.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.participantRow,
                        selectedParticipants.includes(p.id) &&
                          styles.participantRowSelected,
                      ]}
                      onPress={() => toggleParticipant(p.id)}
                    >
                      <Avatar
                        name={p.name}
                        size={32}
                        color={p.color || COLORS.primary}
                      />
                      <Text style={styles.participantName}>{p.name}</Text>
                      {selectedParticipants.includes(p.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={COLORS.accent}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedParticipants.length > 1 && (
                  <>
                    <Text style={styles.fieldLabel}>Split Type</Text>
                    <View style={styles.splitTypeRow}>
                      {["equal", "custom"].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.splitTypeBtn,
                            splitType === type && styles.splitTypeBtnSelected,
                          ]}
                          onPress={() => setSplitType(type)}
                        >
                          <Text
                            style={[
                              styles.splitTypeBtnText,
                              splitType === type &&
                                styles.splitTypeBtnTextSelected,
                            ]}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {splitType === "equal" && amount && (
                      <Text style={styles.splitPreview}>
                        Each pays:{" "}
                        {formatCurrency(
                          parseFloat(amount || 0) / selectedParticipants.length,
                        )}
                      </Text>
                    )}

                    {splitType === "custom" &&
                      selectedParticipants.map((pid) => {
                        const person = persons.find((p) => p.id === pid);
                        return (
                          <Input
                            key={pid}
                            label={`${person?.name}'s share`}
                            placeholder="0.00"
                            value={customSplits[pid] || ""}
                            onChangeText={(v) =>
                              setCustomSplits((prev) => ({ ...prev, [pid]: v }))
                            }
                            keyboardType="decimal-pad"
                          />
                        );
                      })}
                  </>
                )}
              </>
            )}

            {persons.length === 0 && (
              <Text style={styles.noPeopleHint}>
                💡 Add people in the Persons tab to split expenses
              </Text>
            )}

            <Button
              title="Add Expense"
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExportOptionsModal({ visible, onClose, expenses, persons, total }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async (format) => {
    if (expenses.length === 0) {
      Alert.alert("No Expenses", "Add expenses before exporting");
      return;
    }

    setExporting(true);

    try {
      if (format === "pdf") {
        // Generate HTML
        const html = generateExpenseHTML(expenses, persons, total);

        // Convert HTML to a real PDF
        const { uri } = await Print.printToFileAsync({
          html,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Share Expenses PDF",
          });
        }
      } else {
        // Generate CSV
        const timestamp = new Date().toISOString().split("T")[0];

        const file = new File(Paths.document, `expenses_${timestamp}.csv`);

        file.create({ overwrite: true });

        file.write(generateExpenseCSV(expenses));

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            dialogTitle: "Share Expenses CSV",
          });
        }
      }
    } catch (error) {
      Alert.alert("Export Failed", error.message || "Unable to export file");
    } finally {
      setExporting(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.exportOverlay}>
        <View style={styles.exportModal}>
          <View style={styles.exportHeader}>
            <Text style={styles.exportTitle}>Export Expenses</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.exportTotal}>
            Total: {formatCurrency(total)} · {expenses.length} items
          </Text>
          <View style={styles.exportButtons}>
            <Button
              title={exporting ? "Exporting..." : "Download PDF"}
              onPress={() => handleExport("pdf")}
              icon={
                <Ionicons name="document-text" size={18} color={COLORS.white} />
              }
              disabled={exporting}
            />
            <Button
              title={exporting ? "Exporting..." : "Download Excel (CSV)"}
              onPress={() => handleExport("csv")}
              variant="secondary"
              icon={<Ionicons name="grid" size={18} color={COLORS.text} />}
              disabled={exporting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const expenses = useSelector((s) => s.expenses.items);
  const persons = useSelector((s) => s.expenses.persons);
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (filterCategory === "All") return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
    [filtered],
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpenseApi(uid, id);
            dispatch(deleteExpense(id));
          } catch (error) {
            Alert.alert("Error", "Unable to delete expense.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Expenses</Text>
          <Text style={styles.totalText}>{formatCurrency(total)} total</Text>
        </View>
        <View style={styles.topBarButtons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowExport(true)}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: SIZES.md, maxHeight: 30 }}
      >
        {["All", ...CATEGORIES].map((cat) => (
          <Chip
            key={cat}
            label={cat}
            selected={filterCategory === cat}
            onPress={() => setFilterCategory(cat)}
            color={cat === "All" ? COLORS.primary : CATEGORY_COLORS[cat]}
          />
        ))}
      </ScrollView>
      <View style={{ flex: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses yet"
            subtitle="Tap + to add your first expense and optionally split it with others"
            action={() => setShowAdd(true)}
            actionLabel="Add Expense"
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <Card style={styles.expenseItem}>
                  <View style={styles.expenseTop}>
                    <View
                      style={[
                        styles.catIcon,
                        {
                          backgroundColor:
                            (CATEGORY_COLORS[item.category] || COLORS.primary) +
                            "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          CATEGORY_ICONS[item.category] || "ellipsis-horizontal"
                        }
                        size={18}
                        color={CATEGORY_COLORS[item.category] || COLORS.primary}
                      />
                    </View>
                    <View style={styles.expMeta}>
                      <Text style={styles.expDesc}>{item.description}</Text>
                      <Text style={styles.expInfo}>
                        {formatDate(item.date)} · {item.category}
                      </Text>
                      {item.paidByName && (
                        <Text style={styles.expPaidBy}>
                          Paid by {item.paidByName}
                        </Text>
                      )}
                    </View>
                    <View style={styles.expRight}>
                      <Text style={styles.expAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                      {item.splits && item.splits.length > 0 && (
                        <Badge
                          label={`÷${item.splits.length}`}
                          color={COLORS.primary}
                        />
                      )}
                    </View>
                  </View>

                  {expandedId === item.id &&
                    item.splits &&
                    item.splits.length > 0 && (
                      <View style={styles.splitsContainer}>
                        <Text style={styles.splitsTitle}>Split Details</Text>
                        {item.splits.map((split) => (
                          <View key={split.personId} style={styles.splitRow}>
                            <Avatar
                              name={split.personName}
                              size={28}
                              color={COLORS.primary}
                            />
                            <Text style={styles.splitName}>
                              {split.personName}
                            </Text>
                            <Text style={styles.splitAmt}>
                              {formatCurrency(split.amount)}
                            </Text>
                            {split.settled ? (
                              <Badge label="Settled" color={COLORS.accent} />
                            ) : (
                              <TouchableOpacity
                                style={styles.settleBtn}
                                onPress={() =>
                                  dispatch(
                                    settleExpense({
                                      expenseId: item.id,
                                      personId: split.personId,
                                    }),
                                  )
                                }
                              >
                                <Text style={styles.settleBtnText}>
                                  Mark Settled
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                  {expandedId === item.id && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={COLORS.danger}
                      />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <AddExpenseModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        persons={persons}
      />
      <ExportOptionsModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        expenses={filtered}
        persons={persons}
        total={total}
      />
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
  screenTitle: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  totalText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  filterRow: { height: 40 },
  list: { padding: SIZES.md, gap: SIZES.sm },
  expenseItem: { marginBottom: 2 },
  expenseTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  expMeta: { flex: 1 },
  expDesc: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  expInfo: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  expPaidBy: { color: COLORS.primaryLight, fontSize: 11, marginTop: 1 },
  expRight: { alignItems: "flex-end", gap: 4 },
  expAmount: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  splitsContainer: {
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  splitsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  splitName: { flex: 1, color: COLORS.text, fontSize: 13 },
  splitAmt: { color: COLORS.textSecondary, fontSize: 13 },
  settleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.accent + "20",
    borderRadius: 8,
  },
  settleBtnText: { color: COLORS.accent, fontSize: 11, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.sm,
    alignSelf: "flex-end",
    padding: 8,
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 13 },
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
  chipRow: { marginBottom: SIZES.sm },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 24,
  },
  personChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  personChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  personChipTextSelected: { color: COLORS.white },
  participantsList: { marginBottom: SIZES.md },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: SIZES.borderRadiusSm,
    marginBottom: 6,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  participantRowSelected: { borderColor: COLORS.accent },
  participantName: { flex: 1, color: COLORS.text, fontSize: 14 },
  splitTypeRow: { flexDirection: "row", gap: 12, marginBottom: SIZES.md },
  splitTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: SIZES.borderRadiusSm,
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  splitTypeBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  splitTypeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  splitTypeBtnTextSelected: { color: COLORS.white },
  splitPreview: {
    color: COLORS.accent,
    fontSize: 13,
    textAlign: "center",
    marginBottom: SIZES.md,
    fontWeight: "600",
  },
  noPeopleHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginVertical: SIZES.md,
    lineHeight: 20,
  },
  submitBtn: { marginTop: SIZES.sm },
  topBarButtons: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  exportOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  exportModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.lg,
    width: "85%",
    maxWidth: 340,
  },
  exportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  exportTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  exportTotal: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SIZES.md,
    textAlign: "center",
  },
  exportButtons: { gap: SIZES.sm },
});
