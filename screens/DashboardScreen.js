import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { formatCurrency, formatDate, getDaysUntil, WORK_STATUS_COLORS, PRIORITY_COLORS } from '../utils/helpers';
import { Card, Avatar, Badge, SectionHeader, EmptyState } from '../components/UIComponents';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const StatCard = ({ label, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const expenses = useSelector((s) => s.expenses.items);
  const persons = useSelector((s) => s.expenses.persons);
  const tasks = useSelector((s) => s.work.tasks);
  const bills = useSelector((s) => s.reminders.bills);

  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length;
    const upcomingBills = bills.filter((b) => !b.isPaid && getDaysUntil(b.dueDate) >= 0 && getDaysUntil(b.dueDate) <= 7).length;
    const overdueBills = bills.filter((b) => !b.isPaid && getDaysUntil(b.dueDate) < 0).length;
    return { totalExpenses, pendingTasks, upcomingBills, overdueBills };
  }, [expenses, tasks, bills]);

  const recentExpenses = expenses.slice(0, 4);
  const urgentBills = bills
    .filter((b) => !b.isPaid)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);
  const recentTasks = tasks.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello! 👋</Text>
          <Text style={styles.subtitle}>Here's your financial overview</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => dispatch(logout())}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Persons')}>
            <Ionicons name="people" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Expenses</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(stats.totalExpenses)}</Text>
        <View style={styles.balanceMeta}>
          <Ionicons name="trending-up" size={14} color={COLORS.accentOrange} />
          <Text style={styles.balanceMetaText}>{expenses.length} transactions recorded</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks}
          icon="briefcase"
          color={COLORS.primary}
          onPress={() => navigation.navigate('Work')}
        />
        <StatCard
          label="Bills Due Soon"
          value={stats.upcomingBills}
          icon="alarm"
          color={COLORS.accentOrange}
          onPress={() => navigation.navigate('Reminders')}
        />
        <StatCard
          label="Overdue Bills"
          value={stats.overdueBills}
          icon="warning"
          color={COLORS.danger}
          onPress={() => navigation.navigate('Reminders')}
        />
        <StatCard
          label="People"
          value={persons.length}
          icon="people"
          color={COLORS.accent}
          onPress={() => navigation.navigate('Persons')}
        />
      </View>

      {/* Upcoming Bills */}
      <SectionHeader
        title="Upcoming Bills"
        actionLabel="View All"
        action={() => navigation.navigate('Reminders')}
      />
      {urgentBills.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No upcoming bills 🎉</Text>
        </Card>
      ) : (
        urgentBills.map((bill) => {
          const days = getDaysUntil(bill.dueDate);
          const isOverdue = days < 0;
          const isUrgent = days <= 2 && days >= 0;
          return (
            <Card key={bill.id} style={styles.billCard} onPress={() => navigation.navigate('Reminders')}>
              <View style={styles.billLeft}>
                <View style={[styles.billIcon, { backgroundColor: isOverdue ? COLORS.danger + '20' : isUrgent ? COLORS.accentOrange + '20' : COLORS.primary + '20' }]}>
                  <Ionicons name="receipt" size={18} color={isOverdue ? COLORS.danger : isUrgent ? COLORS.accentOrange : COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billDate}>{formatDate(bill.dueDate)}</Text>
                </View>
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text>
                <Badge
                  label={isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                  color={isOverdue ? COLORS.danger : isUrgent ? COLORS.accentOrange : COLORS.accent}
                />
              </View>
            </Card>
          );
        })
      )}

      {/* Recent Expenses */}
      <SectionHeader
        title="Recent Expenses"
        actionLabel="View All"
        action={() => navigation.navigate('Expenses')}
      />
      {recentExpenses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No expenses yet</Text>
        </Card>
      ) : (
        recentExpenses.map((expense) => (
          <Card key={expense.id} style={styles.expenseCard} onPress={() => navigation.navigate('Expenses')}>
            <View style={[styles.expenseDot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseName}>{expense.description}</Text>
              <Text style={styles.expenseDate}>{formatDate(expense.date)} · {expense.category}</Text>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
              {expense.splits && expense.splits.length > 1 && (
                <Text style={styles.expenseSplit}>Split {expense.splits.length} ways</Text>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Recent Tasks */}
      <SectionHeader
        title="Work Schedule"
        actionLabel="View All"
        action={() => navigation.navigate('Work')}
      />
      {recentTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No tasks assigned</Text>
        </Card>
      ) : (
        recentTasks.map((task) => (
          <Card key={task.id} style={styles.taskCard} onPress={() => navigation.navigate('Work')}>
            <View style={[styles.taskPriority, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskAssignee}>{task.assigneeName || 'Unassigned'}</Text>
            </View>
            <Badge
              label={task.status}
              color={WORK_STATUS_COLORS[task.status]}
            />
          </Card>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    paddingTop: SIZES.sm,
  },
  greeting: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },
  balanceAmount: { color: COLORS.white, fontSize: 36, fontWeight: '800', marginTop: 4 },
  balanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  balanceMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: SIZES.md },
  emptyCardText: { color: COLORS.textMuted, fontSize: 14 },
  billCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  billLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  billIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  billName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  billDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  billRight: { alignItems: 'flex-end', gap: 4 },
  billAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SIZES.sm,
  },
  expenseDot: { width: 10, height: 10, borderRadius: 5 },
  expenseInfo: { flex: 1 },
  expenseName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  expenseDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  expenseSplit: { color: COLORS.primaryLight, fontSize: 11, marginTop: 2 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SIZES.sm,
  },
  taskPriority: { width: 4, height: 40, borderRadius: 2 },
  taskInfo: { flex: 1 },
  taskTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  taskAssignee: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
