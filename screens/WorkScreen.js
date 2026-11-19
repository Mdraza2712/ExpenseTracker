import React, { useState, useMemo } from "react";
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
  addTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../store/slices/workSlice";
import { COLORS, SIZES, SHADOWS } from "../utils/theme";
import {
  formatDate,
  generateId,
  WORK_STATUS_COLORS,
  PRIORITY_COLORS,
  formatDateFull,
  formatCurrency,
  generateTaskCSV,
  generateTaskHTML,
} from "../utils/helpers";
import {
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  Chip,
  EmptyState,
} from "../components/UIComponents";
import DateTimePicker from "@react-native-community/datetimepicker";

const STATUSES = ["pending", "in-progress", "completed", "cancelled"];
const PRIORITIES = ["low", "medium", "high"];

function AddTaskModal({ visible, onClose, editTask, persons }) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [selectedAssignees, setSelectedAssignees] = useState(() => {
    if (editTask?.assignees && Array.isArray(editTask.assignees)) {
      return editTask.assignees.map((a) => a.id);
    }
    return editTask?.assigneeId ? [editTask.assigneeId] : [];
  });
  const [priority, setPriority] = useState(editTask?.priority || "medium");
  const [status, setStatus] = useState(editTask?.status || "pending");
  const [dueDate, setDueDate] = useState(
    editTask?.dueDate || new Date().toISOString().split("T")[0],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    if (editTask?.dueDate) {
      return new Date(editTask.dueDate);
    }
    return new Date();
  });

  React.useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || "");
      setDescription(editTask.description || "");
      setPriority(editTask.priority || "medium");
      setStatus(editTask.status || "pending");
      if (editTask?.dueDate) {
        const date = new Date(editTask.dueDate);
        setSelectedDate(date);
        setDueDate(date.toISOString().split("T")[0]);
      } else {
        const today = new Date();
        setSelectedDate(today);
        setDueDate(today.toISOString().split("T")[0]);
      }
      if (editTask.assignees && Array.isArray(editTask.assignees)) {
        setSelectedAssignees(editTask.assignees.map((a) => a.id));
      } else if (editTask.assigneeId) {
        setSelectedAssignees([editTask.assigneeId]);
      } else {
        setSelectedAssignees([]);
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("pending");
      const today = new Date();
      setSelectedDate(today);
      if (editTask?.dueDate) {
        const d = new Date(editTask.dueDate);

        if (!isNaN(d.getTime())) {
          setSelectedDate(d);
        }
      } else {
        setSelectedDate(new Date());
      }
      setSelectedAssignees([]);
    }
  }, [editTask]);
  const onDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!date) return;

    setSelectedDate(date);

    const formattedDate = date.toISOString().split("T")[0];

    setDueDate(formattedDate);
  };

  const handleSubmit = () => {
    // Task Title
    if (!title.trim()) {
      return Alert.alert("Error", "Please enter a task title.");
    }

    // Description (optional, remove this if you don't want it required)
    if (!description.trim()) {
      return Alert.alert("Error", "Please enter a task description.");
    }

    // Assignees
    if (selectedAssignees.length === 0) {
      return Alert.alert(
        "Error",
        "Please assign the task to at least one person.",
      );
    }

    // Priority
    if (!priority) {
      return Alert.alert("Error", "Please select a priority.");
    }

    // Status
    if (!status) {
      return Alert.alert("Error", "Please select a status.");
    }

    // Due Date
    if (!selectedDate) {
      return Alert.alert("Error", "Please select a due date.");
    }

    // Optional: Prevent selecting a past date
    if (new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
      return Alert.alert("Error", "Due date cannot be in the past.");
    }

    const assignees = selectedAssignees.map((id) => {
      const person = persons.find((p) => p.id === id);
      return {
        id,
        name: person?.name || "",
      };
    });

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignees,
      priority,
      status,
      dueDate: selectedDate.toISOString(),
    };

    if (editTask) {
      dispatch(updateTask({ ...editTask, ...payload }));
      Alert.alert("Success", "Task updated successfully.");
    } else {
      dispatch(addTask(payload));
      Alert.alert("Success", "Task added successfully.");
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editTask ? "Edit Task" : "New Task"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Task Title"
              placeholder="What needs to be done?"
              value={title}
              onChangeText={(text) =>
                setTitle(text.replace(/[^a-zA-Z\s]/g, "").slice(0, 50))
              }
              maxLength={50}
            />
            <Input
              label="Description"
              placeholder="Add more details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
              maxLength={200}
            />
            <Text style={styles.fieldLabel}>Due Date</Text>

            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />

              <Text style={styles.datePickerText}>
                {dueDate || "Select Due Date"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.rowChips}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: PRIORITY_COLORS[p] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p && { color: COLORS.white },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {editTask && (
              <>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.rowChips}>
                  {STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusChip,
                        status === s && {
                          backgroundColor: WORK_STATUS_COLORS[s] + "30",
                          borderColor: WORK_STATUS_COLORS[s],
                        },
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          status === s && { color: WORK_STATUS_COLORS[s] },
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {persons.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Assign To</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: SIZES.md }}
                >
                  {persons.map((p) => {
                    const isSelected = selectedAssignees.includes(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.personChip,
                          isSelected && styles.personChipSelected,
                        ]}
                        onPress={() =>
                          setSelectedAssignees((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((id) => id !== p.id)
                              : [...prev, p.id],
                          )
                        }
                      >
                        <Avatar
                          name={p.name}
                          size={22}
                          color={p.color || COLORS.primary}
                        />
                        <Text
                          style={[
                            styles.personChipText,
                            isSelected && styles.personChipTextSelected,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Button
              title={editTask ? "Update Task" : "Create Task"}
              onPress={handleSubmit}
              style={{ marginTop: 8 }}
            />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExportOptionsModal({ visible, onClose, tasks }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    if (tasks.length === 0) {
      Alert.alert("No Tasks", "Add tasks before exporting");
      return;
    }

    setExporting(true);

    try {
      if (format === "pdf") {
        // Generate HTML
        const html = generateTaskHTML(tasks);

        // Convert HTML to REAL PDF
        const { uri } = await Print.printToFileAsync({
          html,
        });

        // Share PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Share Tasks PDF",
          });
        }
      } else {
        // Generate CSV
        const timestamp = new Date().toISOString().split("T")[0];
        const file = new File(Paths.document, `tasks_${timestamp}.csv`);

        file.create({ overwrite: true });
        file.write(generateTaskCSV(tasks));

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            dialogTitle: "Share Tasks CSV",
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
            <Text style={styles.exportTitle}>Export Tasks</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.exportTotal}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · Exported on{" "}
            {formatDateFull(new Date())}
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

export default function WorkScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const tasks = useSelector((s) => s.work.tasks);
  const persons = useSelector((s) => s.expenses.persons);
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (filterStatus === "all") return tasks;
    return tasks.filter((t) => t.status === filterStatus);
  }, [tasks, filterStatus]);

  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

  const handleDelete = (id) => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch(deleteTask(id)),
      },
    ]);
  };

  const cycleStatus = (task) => {
    const idx = STATUSES.indexOf(task.status);
    const next = STATUSES[(idx + 1) % (STATUSES.length - 1)]; // skip cancelled
    dispatch(updateTaskStatus({ id: task.id, status: next }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Work Schedule</Text>
          <Text style={styles.totalText}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </Text>
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
            onPress={() => {
              setEditTask(null);
              setShowAdd(true);
            }}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: SIZES.md, maxHeight: 36 }}
      >
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["in-progress", "In Progress"],
          ["completed", "Done"],
        ].map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[
              styles.filterBtn,
              filterStatus === val && {
                backgroundColor:
                  (WORK_STATUS_COLORS[val] || COLORS.primary) + "30",
                borderColor: WORK_STATUS_COLORS[val] || COLORS.primary,
              },
            ]}
            onPress={() => setFilterStatus(val)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterStatus === val && {
                  color: WORK_STATUS_COLORS[val] || COLORS.primary,
                },
              ]}
            >
              {label} ({statusCounts[val] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks"
            subtitle="Create tasks and assign them to team members to track work progress"
            action={() => setShowAdd(true)}
            actionLabel="Create Task"
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card style={styles.taskCard}>
                <View style={styles.taskTop}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggle,
                      { borderColor: WORK_STATUS_COLORS[item.status] },
                    ]}
                    onPress={() => cycleStatus(item)}
                  >
                    {item.status === "completed" && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={WORK_STATUS_COLORS.completed}
                      />
                    )}
                    {item.status === "in-progress" && (
                      <Ionicons
                        name="time"
                        size={14}
                        color={WORK_STATUS_COLORS["in-progress"]}
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitle,
                        item.status === "completed" && styles.taskTitleDone,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditTask(item);
                        setShowAdd(true);
                      }}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.taskMeta}>
                  <View
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: PRIORITY_COLORS[item.priority] },
                    ]}
                  />
                  <Text style={styles.metaText}>{item.priority} priority</Text>
                  {item.dueDate && (
                    <>
                      <View style={styles.metaDot} />
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {formatDate(item.dueDate)}
                      </Text>
                    </>
                  )}
                  <View style={{ flex: 1 }} />
                  <Badge
                    label={item.status}
                    color={WORK_STATUS_COLORS[item.status]}
                  />
                </View>

                {item.assignees && item.assignees.length > 0 && (
                  <View style={styles.assigneesRow}>
                    {item.assignees.map((a) => (
                      <View key={a.id} style={styles.assigneeChip}>
                        <Avatar
                          name={a.name}
                          size={24}
                          color={COLORS.primary}
                        />
                      </View>
                    ))}
                    <Text style={styles.assigneesText}>
                      {item.assignees.map((a) => a.name).join(", ")}
                    </Text>
                  </View>
                )}
                {!item.assignees && item.assigneeName && (
                  <View style={styles.assigneeRow}>
                    <Avatar
                      name={item.assigneeName}
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.assigneeName}>{item.assigneeName}</Text>
                  </View>
                )}
              </Card>
            )}
          />
        )}
      </View>

      <AddTaskModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditTask(null);
        }}
        editTask={editTask}
        persons={persons}
      />
      <ExportOptionsModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        tasks={filtered}
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
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
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
  filterRow: { paddingVertical: SIZES.sm },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SIZES.sm,
  },
  filterBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  list: { padding: SIZES.md, gap: SIZES.sm },
  taskCard: { marginBottom: 2 },
  taskTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  statusToggle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  taskDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  taskActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  priorityIndicator: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: COLORS.textMuted, fontSize: 12 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  assigneeName: { color: COLORS.textSecondary, fontSize: 13 },
  assigneesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  assigneeChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  assigneesText: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
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
    maxHeight: "90%",
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
  rowChips: {
    flexDirection: "row",
    gap: 10,
    marginBottom: SIZES.md,
    flexWrap: "wrap",
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusText: { color: COLORS.textSecondary, fontSize: 13 },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.borderRadiusSm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: SIZES.md,
  },

  datePickerText: {
    color: COLORS.text,
    fontSize: 15,
    marginLeft: 10,
  },
});
