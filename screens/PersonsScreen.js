import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addPerson,
  updatePerson,
  deletePerson,
} from "../store/slices/expensesSlice";
import { COLORS, SIZES, SHADOWS } from "../utils/theme";
import { formatCurrency, getBalanceSummary } from "../utils/helpers";
import {
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  EmptyState,
} from "../components/UIComponents";
// import { createRemote, updateRemote } from "../services/firebaseSync";
import {
  addPersonApi,
  updatePersonApi,
  deletePersonApi,
  getPersonsApi,
} from "../services/personApi";

const AVATAR_COLORS = [
  "#6C63FF",
  "#FF6584",
  "#43E97B",
  "#FF9A3C",
  "#38B2AC",
  "#F6C90E",
  "#FF6B6B",
  "#4ECDC4",
  "#A78BFA",
  "#FB923C",
];

export default function PersonsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const persons = useSelector((s) => s.expenses.persons);
  const expenses = useSelector((s) => s.expenses.items);
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const uid = useSelector((state) => state.auth.user?.uid);

  function AddPersonModal({ visible, onClose, editPerson, person }) {
    const dispatch = useDispatch();
    const [name, setName] = useState(editPerson?.name || "");
    const [email, setEmail] = useState(editPerson?.email || "");
    const [phone, setPhone] = useState(editPerson?.phone || "");
    const [color, setColor] = useState(editPerson?.color || AVATAR_COLORS[0]);

    useEffect(() => {
      const loadPersons = async () => {
        try {
          const data = await getPersonsApi(uid);

          if (!data) return;

          const persons = Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }));

          // Dispatch an action that replaces the persons array in Redux
          // Example:
          // dispatch(setPersons(persons));
        } catch (err) {
          console.log(err);
        }
      };

      if (uid) {
        loadPersons();
      }
    }, [uid]);

    useEffect(() => {
      if (editPerson) {
        setName(editPerson.name || "");
        setEmail(editPerson.email || "");
        setPhone(editPerson.phone || "");
      } else {
        setName("");
        setEmail("");
        setPhone("");
      }
    }, [editPerson, visible]);

    const handleSubmit = async () => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      // Name validation
      if (!trimmedName) {
        return Alert.alert("Validation Error", "Please enter a person's name.");
      }

      if (trimmedName.length < 2) {
        return Alert.alert(
          "Validation Error",
          "Name must be at least 2 characters long.",
        );
      }

      if (trimmedName.length > 50) {
        return Alert.alert(
          "Validation Error",
          "Name cannot exceed 50 characters.",
        );
      }

      if (!/^[A-Za-z ]+$/.test(trimmedName)) {
        return Alert.alert(
          "Validation Error",
          "Name can contain only letters and spaces.",
        );
      }

      // Email validation (optional)
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return Alert.alert(
          "Validation Error",
          "Please enter a valid email address.",
        );
      }

      // Phone validation (optional)
      if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
        return Alert.alert(
          "Validation Error",
          "Please enter a valid 10-digit mobile number.",
        );
      }

      // Duplicate name validation
      const duplicate = persons.find(
        (person) =>
          person.name.toLowerCase() === trimmedName.toLowerCase() &&
          person.id !== editPerson?.id,
      );

      if (duplicate) {
        return Alert.alert(
          "Validation Error",
          "A person with this name already exists.",
        );
      }

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        color,
      };
      if (editPerson) {
        await updatePersonApi(uid, editPerson.id, payload);

        dispatch(
          updatePerson({
            ...editPerson,
            ...payload,
          }),
        );

        Alert.alert("Success", "Person updated successfully.");
      } else {
        const result = await addPersonApi(uid, payload);

        dispatch(
          addPerson({
            id: result.name, // Firebase generated key
            ...payload,
          }),
        );

        Alert.alert("Success", "Person added successfully.");
      }

      setName("");
      setEmail("");
      setPhone("");

      onClose();
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editPerson ? "Edit Person" : "Add Person"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Avatar Preview */}
            <View style={styles.avatarPreview}>
              <Avatar name={name || "?"} size={72} color={color} />
            </View>

            {/* Color Picker  */}
            <Text style={styles.fieldLabel}>Avatar Color</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Full Name *"
              placeholder="Your Name"
              value={name}
              maxLength={50}
              onChangeText={(text) => setName(text.replace(/[^A-Za-z ]/g, ""))}
            />
            <Input
              label="Email"
              placeholder="Your Email"
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
            />
            <Input
              label="Phone"
              placeholder="Phone Number"
              value={phone}
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
            />

            <Button
              title={editPerson ? "Update" : "Add Person"}
              onPress={handleSubmit}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  const balances = useMemo(
    () => getBalanceSummary(expenses, persons),
    [expenses, persons],
  );

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Person",
      "This person will be removed but their expense records will remain.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePersonApi(uid, id);
            dispatch(deletePerson(id));
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>People</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditPerson(null);
            setShowAdd(true);
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {persons.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No people added"
          subtitle="Add people to split expenses, assign tasks, and track who owes what"
          action={() => setShowAdd(true)}
          actionLabel="Add Person"
        />
      ) : (
        <FlatList
          data={persons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            expenses.length > 0 && balances.some((b) => b.net !== 0) ? (
              <View style={styles.balanceSection}>
                <Text style={styles.balanceSectionTitle}>Balance Summary</Text>
                {balances.map(
                  (b) =>
                    b.net !== 0 && (
                      <Card key={b.person.id} style={styles.balanceCard}>
                        <Avatar
                          name={b.person.name}
                          size={36}
                          color={b.person.color}
                        />
                        <View style={styles.balanceInfo}>
                          <Text style={styles.balanceName}>
                            {b.person.name}
                          </Text>
                          <View style={styles.balanceDetails}>
                            <Text style={styles.balanceOwes}>
                              Owes: {formatCurrency(b.owes)}
                            </Text>
                            <Text style={styles.balanceDot}>·</Text>
                            <Text style={styles.balanceOwed}>
                              Owed: {formatCurrency(b.owed)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.netBalance}>
                          <Text
                            style={[
                              styles.netAmount,
                              {
                                color:
                                  b.net >= 0 ? COLORS.accent : COLORS.danger,
                              },
                            ]}
                          >
                            {b.net >= 0 ? "+" : ""}
                            {formatCurrency(b.net)}
                          </Text>
                          <Text style={styles.netLabel}>
                            {b.net >= 0 ? "net owed" : "net owes"}
                          </Text>
                        </View>
                      </Card>
                    ),
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const balance = balances.find((b) => b.person.id === item.id);
            const personExpenses = expenses.filter(
              (e) =>
                e.paidBy === item.id ||
                (e.splits && e.splits.some((s) => s.personId === item.id)),
            );
            return (
              <Card style={styles.personCard}>
                <View style={styles.personTop}>
                  <Avatar name={item.name} size={52} color={item.color} />
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{item.name}</Text>
                    {item.email ? (
                      <Text style={styles.personDetail}>{item.email}</Text>
                    ) : null}
                    {item.phone ? (
                      <Text style={styles.personDetail}>{item.phone}</Text>
                    ) : null}
                  </View>
                  <View style={styles.personActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditPerson(item);
                        setShowAdd(true);
                      }}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name="pencil"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="trash" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.personStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>{personExpenses.length}</Text>
                    <Text style={styles.statLbl}>expenses</Text>
                  </View>
                  {balance && (
                    <>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text
                          style={[styles.statNum, { color: COLORS.accent }]}
                        >
                          {formatCurrency(balance.owed)}
                        </Text>
                        <Text style={styles.statLbl}>others owe</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text
                          style={[styles.statNum, { color: COLORS.danger }]}
                        >
                          {formatCurrency(balance.owes)}
                        </Text>
                        <Text style={styles.statLbl}>they owe</Text>
                      </View>
                    </>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}

      <AddPersonModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditPerson(null);
        }}
        editPerson={editPerson}
        persons={persons}
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
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  list: { padding: SIZES.md },
  balanceSection: { marginBottom: SIZES.md },
  balanceSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: SIZES.sm,
  },
  balanceInfo: { flex: 1 },
  balanceName: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  balanceDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  balanceOwes: { color: COLORS.danger, fontSize: 12 },
  balanceDot: { color: COLORS.textMuted },
  balanceOwed: { color: COLORS.accent, fontSize: 12 },
  netBalance: { alignItems: "flex-end" },
  netAmount: { fontSize: 16, fontWeight: "700" },
  netLabel: { color: COLORS.textMuted, fontSize: 11 },
  personCard: { marginBottom: SIZES.sm },
  personTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  personInfo: { flex: 1 },
  personName: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  personDetail: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  personActions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 6 },
  personStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  statLbl: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.cardBorder },
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
  avatarPreview: { alignItems: "center", marginBottom: SIZES.md },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: SIZES.md,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: { borderColor: COLORS.white, transform: [{ scale: 1.15 }] },
});
