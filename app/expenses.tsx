import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Plus, X, IndianRupee, Check, Receipt } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { Expense } from '@/types';

const CATEGORIES = [
  { id: 'food' as const, label: 'Food', emoji: '🍕' },
  { id: 'rent' as const, label: 'Rent', emoji: '🏠' },
  { id: 'transport' as const, label: 'Transport', emoji: '🚗' },
  { id: 'entertainment' as const, label: 'Fun', emoji: '🎬' },
  { id: 'shopping' as const, label: 'Shopping', emoji: '🛒' },
  { id: 'other' as const, label: 'Other', emoji: '📦' },
];

export default function ExpensesScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { getCircleById, getCircleExpenses, addExpense, settleExpense } = useCircles();
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('other');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(circleId ?? '');
  const expenses = getCircleExpenses(circleId ?? '');

  const balances = useMemo(() => {
    if (!circle || !user) return new Map<string, number>();
    const map = new Map<string, number>();
    circle.members.forEach(m => map.set(m.id, 0));

    expenses.forEach(exp => {
      const perPerson = exp.amount / exp.splitAmong.length;
      exp.splitAmong.forEach(memberId => {
        if (memberId !== exp.paidBy.id && !exp.settled.includes(memberId)) {
          map.set(memberId, (map.get(memberId) ?? 0) - perPerson);
          map.set(exp.paidBy.id, (map.get(exp.paidBy.id) ?? 0) + perPerson);
        }
      });
    });
    return map;
  }, [expenses, circle, user]);

  const handleAddExpense = useCallback(() => {
    if (!title.trim() || !amount.trim() || !circle || !user) {
      Alert.alert('Missing info', 'Enter a title and amount.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid positive amount.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const splitMembers = selectedMembers.length > 0
      ? selectedMembers
      : circle.members.map(m => m.id);

    const expense: Expense = {
      id: `exp-${Date.now()}`,
      circleId: circle.id,
      title: title.trim(),
      amount: amountNum,
      paidBy: user,
      splitAmong: splitMembers,
      settled: [],
      createdAt: new Date().toISOString(),
      category,
    };
    addExpense(expense);
    setTitle('');
    setAmount('');
    setCategory('other');
    setSelectedMembers([]);
    setShowAddModal(false);
  }, [title, amount, category, selectedMembers, circle, user, addExpense]);

  const handleSettle = useCallback((expenseId: string) => {
    if (!user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    settleExpense(expenseId, user.id);
    Alert.alert('Settled!', 'Your share has been marked as paid.');
  }, [user, settleExpense]);

  const toggleMember = useCallback((memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  if (!circle) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEmoji}>{circle.emoji}</Text>
              <Text style={styles.summaryCircleName}>{circle.name}</Text>
            </View>
            <Text style={styles.totalAmount}>₹{totalExpenses.toFixed(0)}</Text>
            <Text style={styles.totalLabel}>Total expenses</Text>
          </View>

          {circle.members.length > 0 && (
            <View style={styles.balancesSection}>
              <Text style={styles.sectionTitle}>Balances</Text>
              {circle.members.map(member => {
                const balance = balances.get(member.id) ?? 0;
                const isMe = member.id === user?.id;
                return (
                  <View key={member.id} style={styles.balanceRow}>
                    <Image source={{ uri: member.avatar }} style={styles.balanceAvatar} />
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceName}>
                        {member.name}{isMe ? ' (You)' : ''}
                      </Text>
                      <Text style={[
                        styles.balanceAmount,
                        balance > 0 ? styles.positive : balance < 0 ? styles.negative : null,
                      ]}>
                        {balance > 0 ? `Gets back ₹${balance.toFixed(0)}` :
                         balance < 0 ? `Owes ₹${Math.abs(balance).toFixed(0)}` :
                         'Settled up'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.expensesSection}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {expenses.length > 0 ? expenses.map(exp => {
              const catInfo = CATEGORIES.find(c => c.id === exp.category);
              const isSettled = exp.settled.includes(user?.id ?? '');
              const perPerson = exp.amount / exp.splitAmong.length;
              return (
                <View key={exp.id} style={styles.expenseCard}>
                  <View style={styles.expenseLeft}>
                    <View style={styles.expenseCatBadge}>
                      <Text style={styles.expenseCatEmoji}>{catInfo?.emoji ?? '📦'}</Text>
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>{exp.title}</Text>
                      <Text style={styles.expenseMeta}>
                        Paid by {exp.paidBy.name} · ₹{perPerson.toFixed(0)}/person
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>₹{exp.amount.toFixed(0)}</Text>
                    {exp.paidBy.id !== user?.id && !isSettled && (
                      <TouchableOpacity
                        style={styles.settleBtn}
                        onPress={() => handleSettle(exp.id)}
                      >
                        <Check size={12} color={colors.success} />
                        <Text style={styles.settleText}>Settle</Text>
                      </TouchableOpacity>
                    )}
                    {isSettled && (
                      <Text style={styles.settledText}>Settled ✓</Text>
                    )}
                  </View>
                </View>
              );
            }) : (
              <View style={styles.emptyState}>
                <Receipt size={32} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Add your first expense to start tracking</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <TouchableOpacity onPress={handleAddExpense}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Dinner, Groceries, Uber"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (₹)</Text>
                  <View style={styles.amountInputRow}>
                    <IndianRupee size={16} color={colors.textTertiary} />
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categoryRow}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catChip, category === cat.id && styles.catChipActive]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text style={styles.catEmoji}>{cat.emoji}</Text>
                        <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Split among (tap to select, empty = all)</Text>
                  <View style={styles.membersRow}>
                    {circle.members.map(member => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[styles.memberChip, isSelected && styles.memberChipActive]}
                          onPress={() => toggleMember(member.id)}
                        >
                          <Image source={{ uri: member.avatar }} style={styles.memberChipAvatar} />
                          <Text style={[styles.memberChipName, isSelected && styles.memberChipNameActive]}>
                            {member.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 40 },
  summaryCard: {
    alignItems: 'center', backgroundColor: colors.teal50,
    margin: 20, padding: 24, borderRadius: 20,
    borderWidth: 1, borderColor: colors.teal100,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  summaryEmoji: { fontSize: 24 },
  summaryCircleName: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  totalAmount: { fontSize: 36, fontWeight: '700' as const, color: colors.primaryDark },
  totalLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  balancesSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, padding: 12, borderRadius: 14, marginBottom: 6,
  },
  balanceAvatar: { width: 36, height: 36, borderRadius: 18 },
  balanceInfo: { flex: 1, marginLeft: 10 },
  balanceName: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  balanceAmount: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  positive: { color: colors.success },
  negative: { color: colors.danger },
  expensesSection: { paddingHorizontal: 20 },
  expenseCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8,
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseCatBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  expenseCatEmoji: { fontSize: 20 },
  expenseInfo: { marginLeft: 10, flex: 1 },
  expenseTitle: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  expenseMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  settleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: colors.success + '15',
  },
  settleText: { fontSize: 11, fontWeight: '500' as const, color: colors.success },
  settledText: { fontSize: 11, color: colors.success, fontWeight: '500' as const, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  saveText: { fontSize: 15, fontWeight: '600' as const, color: colors.primary },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  amountInput: { flex: 1, padding: 14, fontSize: 20, fontWeight: '700' as const, color: colors.text },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: 'transparent',
  },
  catChipActive: { backgroundColor: colors.teal50, borderColor: colors.primary },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, color: colors.textSecondary },
  catLabelActive: { color: colors.primary, fontWeight: '600' as const },
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: 'transparent',
  },
  memberChipActive: { backgroundColor: colors.teal50, borderColor: colors.primary },
  memberChipAvatar: { width: 24, height: 24, borderRadius: 12 },
  memberChipName: { fontSize: 13, color: colors.textSecondary },
  memberChipNameActive: { color: colors.primary, fontWeight: '600' as const },
});
