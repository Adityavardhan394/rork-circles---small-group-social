import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Plus,
  X,
  IndianRupee,
  Check,
  Receipt,
  Users,
  ArrowRight,
  Wallet,
  ChevronDown,
  ChevronUp,
  Percent,
  Equal,
  SplitSquareHorizontal,
  CreditCard,
  CircleDollarSign,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { Expense, User as UserType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'food' as const, label: 'Food', emoji: '🍕' },
  { id: 'rent' as const, label: 'Rent', emoji: '🏠' },
  { id: 'transport' as const, label: 'Transport', emoji: '🚗' },
  { id: 'entertainment' as const, label: 'Fun', emoji: '🎬' },
  { id: 'shopping' as const, label: 'Shopping', emoji: '🛒' },
  { id: 'other' as const, label: 'Other', emoji: '📦' },
];

const UPI_APPS = [
  { id: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay', color: '#5F259F', emoji: '💜' },
  { id: 'gpay', name: 'GPay', scheme: 'tez://upi/pay', color: '#4285F4', emoji: '💙' },
  { id: 'paytm', name: 'Paytm', scheme: 'paytmmp://pay', color: '#00BAF2', emoji: '🩵' },
  { id: 'generic', name: 'Other UPI', scheme: 'upi://pay', color: '#FF6B00', emoji: '🧡' },
];

type SplitType = 'equal' | 'custom' | 'percentage';

export default function ExpensesScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { getCircleById, getCircleExpenses, addExpense, settleExpense } = useCircles();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<{ member: UserType; amount: number } | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('other');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'splits' | 'history'>('splits');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const circle = getCircleById(circleId ?? '');
  const expenses = getCircleExpenses(circleId ?? '');

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'splits' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  const simplifiedDebts = useMemo(() => {
    if (!circle || !user) return [];
    const netBalances = new Map<string, number>();
    circle.members.forEach(m => netBalances.set(m.id, 0));

    expenses.forEach(exp => {
      const splitMembers = exp.splitAmong;
      const perPerson = exp.amount / splitMembers.length;
      splitMembers.forEach(memberId => {
        if (memberId !== exp.paidBy.id) {
          const isSettled = exp.settled.includes(memberId);
          if (!isSettled) {
            netBalances.set(memberId, (netBalances.get(memberId) ?? 0) - perPerson);
            netBalances.set(exp.paidBy.id, (netBalances.get(exp.paidBy.id) ?? 0) + perPerson);
          }
        }
      });
    });

    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    netBalances.forEach((balance, id) => {
      if (balance < -0.5) debtors.push({ id, amount: -balance });
      if (balance > 0.5) creditors.push({ id, amount: balance });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: { from: string; to: string; amount: number }[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
      if (settleAmount > 0.5) {
        transactions.push({
          from: debtors[i].id,
          to: creditors[j].id,
          amount: Math.round(settleAmount),
        });
      }
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      if (debtors[i].amount < 0.5) i++;
      if (creditors[j].amount < 0.5) j++;
    }

    return transactions;
  }, [expenses, circle, user]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const myBalance = useMemo(() => {
    if (!user) return 0;
    let balance = 0;
    simplifiedDebts.forEach(t => {
      if (t.from === user.id) balance -= t.amount;
      if (t.to === user.id) balance += t.amount;
    });
    return balance;
  }, [simplifiedDebts, user]);

  const getMember = useCallback((memberId: string) => {
    return circle?.members.find(m => m.id === memberId);
  }, [circle]);

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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const splitMembers = selectedMembers.length > 0
      ? selectedMembers
      : circle.members.map(m => m.id);

    let finalCustomSplits: Record<string, number> | undefined;

    if (splitType === 'custom') {
      finalCustomSplits = {};
      let totalCustom = 0;
      splitMembers.forEach(id => {
        const val = parseFloat(customSplits[id] || '0');
        finalCustomSplits![id] = val;
        totalCustom += val;
      });
      if (Math.abs(totalCustom - amountNum) > 1) {
        Alert.alert('Split mismatch', `Custom amounts total ₹${totalCustom.toFixed(0)} but expense is ₹${amountNum.toFixed(0)}`);
        return;
      }
    } else if (splitType === 'percentage') {
      finalCustomSplits = {};
      let totalPercent = 0;
      splitMembers.forEach(id => {
        const pct = parseFloat(customSplits[id] || '0');
        totalPercent += pct;
        finalCustomSplits![id] = Math.round((pct / 100) * amountNum);
      });
      if (Math.abs(totalPercent - 100) > 1) {
        Alert.alert('Percentage mismatch', `Percentages total ${totalPercent.toFixed(0)}% instead of 100%`);
        return;
      }
    }

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
      splitType,
      customSplits: finalCustomSplits,
    };
    addExpense(expense);
    setTitle('');
    setAmount('');
    setCategory('other');
    setSelectedMembers([]);
    setSplitType('equal');
    setCustomSplits({});
    setShowAddModal(false);
  }, [title, amount, category, selectedMembers, circle, user, addExpense, splitType, customSplits]);

  const handleSettle = useCallback((expenseId: string, targetUserId?: string) => {
    if (!user) return;
    const settleId = targetUserId ?? user.id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    settleExpense(expenseId, settleId);
    console.log('[Expenses] Settled expense', expenseId, 'for user', settleId);
  }, [user, settleExpense]);

  const handlePay = useCallback((member: UserType, payAmount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayTarget({ member, amount: payAmount });
    setShowPayModal(true);
  }, []);

  const openUPIApp = useCallback((appScheme: string) => {
    if (!payTarget || !user) return;

    const upiParams = new URLSearchParams({
      pa: '',
      pn: payTarget.member.name,
      am: payTarget.amount.toString(),
      cu: 'INR',
      tn: `Split payment to ${payTarget.member.name}`,
    });

    const upiUrl = `${appScheme}?${upiParams.toString()}`;

    const confirmSettlement = () => {
      Alert.alert(
        'Payment Confirmation',
        `Did you complete the payment of ₹${payTarget.amount} to ${payTarget.member.name}? This will mark your share as settled.`,
        [
          { text: 'No, still pending', style: 'cancel' },
          {
            text: 'Yes, I paid',
            onPress: () => {
              expenses.forEach(exp => {
                if (exp.paidBy.id === payTarget.member.id && !exp.settled.includes(user.id) && exp.splitAmong.includes(user.id)) {
                  handleSettle(exp.id, user.id);
                }
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Payment Recorded', `Your payment to ${payTarget.member.name} has been marked as settled.`);
            },
          },
        ]
      );
    };

    if (Platform.OS === 'web') {
      Alert.alert(
        'UPI Payment',
        `Open your UPI app and pay ₹${payTarget.amount} to ${payTarget.member.name}`,
        [{ text: 'OK', onPress: confirmSettlement }]
      );
      setShowPayModal(false);
      return;
    }

    Linking.canOpenURL(appScheme).then(supported => {
      if (supported) {
        Linking.openURL(upiUrl).then(() => {
          setTimeout(confirmSettlement, 1000);
        }).catch(() => {
          Linking.openURL(`upi://pay?${upiParams.toString()}`).then(() => {
            setTimeout(confirmSettlement, 1000);
          }).catch(() => {
            Alert.alert('Error', 'Could not open UPI app. Please try another app.');
          });
        });
      } else {
        Linking.openURL(`upi://pay?${upiParams.toString()}`).then(() => {
          setTimeout(confirmSettlement, 1000);
        }).catch(() => {
          Alert.alert('No UPI App', 'No UPI app found. Please install a UPI app to make payments.');
        });
      }
    });

    setShowPayModal(false);
  }, [payTarget, user, expenses, handleSettle]);

  const toggleMember = useCallback((memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const getPerPersonAmount = useCallback((exp: Expense, memberId: string) => {
    if (exp.customSplits && exp.customSplits[memberId] !== undefined) {
      return exp.customSplits[memberId];
    }
    return exp.amount / exp.splitAmong.length;
  }, []);

  const activeSplitMembers = useMemo(() => {
    if (!circle) return [];
    return selectedMembers.length > 0
      ? circle.members.filter(m => selectedMembers.includes(m.id))
      : circle.members;
  }, [circle, selectedMembers]);

  const perPersonSplit = useMemo(() => {
    const amountNum = parseFloat(amount) || 0;
    if (activeSplitMembers.length === 0) return 0;
    return Math.round(amountNum / activeSplitMembers.length);
  }, [amount, activeSplitMembers]);

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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>{circle.emoji} {circle.name}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Total Spent</Text>
                <Text style={styles.heroStatValue}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatLabel}>Your Balance</Text>
                <Text style={[
                  styles.heroStatValue,
                  myBalance > 0 ? styles.positiveText : myBalance < 0 ? styles.negativeText : null,
                ]}>
                  {myBalance > 0 ? '+' : ''}₹{Math.abs(myBalance).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={styles.heroBottom}>
              <View style={styles.heroInfoRow}>
                <Users size={14} color={colors.textSecondary} />
                <Text style={styles.heroInfoText}>
                  {circle.members.length} members · {expenses.length} expenses
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tabBar}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (SCREEN_WIDTH - 48) / 2],
                    }),
                  }],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('splits')}
            >
              <SplitSquareHorizontal size={16} color={activeTab === 'splits' ? colors.primary : colors.textTertiary} />
              <Text style={[styles.tabText, activeTab === 'splits' && styles.tabTextActive]}>
                Splits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('history')}
            >
              <Receipt size={16} color={activeTab === 'history' ? colors.primary : colors.textTertiary} />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                History
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'splits' ? (
            <View style={styles.section}>
              {simplifiedDebts.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Simplified Settlements</Text>
                  <Text style={styles.sectionSubtitle}>Minimum transactions needed to settle up</Text>
                  {simplifiedDebts.map((debt, index) => {
                    const fromMember = getMember(debt.from);
                    const toMember = getMember(debt.to);
                    if (!fromMember || !toMember) return null;
                    const isMe = debt.from === user?.id;

                    return (
                      <View key={`${debt.from}-${debt.to}-${index}`} style={styles.splitCard}>
                        <View style={styles.splitCardTop}>
                          <View style={styles.splitAvatarSection}>
                            <View style={styles.splitAvatarWrap}>
                              <Image source={{ uri: fromMember.avatar }} style={styles.splitAvatar} />
                              {isMe && <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>}
                            </View>
                            <ArrowRight size={16} color={colors.textTertiary} />
                            <View style={styles.splitAvatarWrap}>
                              <Image source={{ uri: toMember.avatar }} style={styles.splitAvatar} />
                              {debt.to === user?.id && <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>}
                            </View>
                          </View>
                          <View style={styles.splitAmountSection}>
                            <Text style={styles.splitAmount}>₹{debt.amount.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                        <View style={styles.splitCardBottom}>
                          <Text style={styles.splitDescription}>
                            <Text style={styles.splitNameBold}>{isMe ? 'You' : fromMember.name}</Text>
                            {' owes '}
                            <Text style={styles.splitNameBold}>{debt.to === user?.id ? 'you' : toMember.name}</Text>
                          </Text>
                          {isMe && (
                            <TouchableOpacity
                              style={styles.payNowBtn}
                              onPress={() => handlePay(toMember, debt.amount)}
                              activeOpacity={0.7}
                            >
                              <Wallet size={14} color="#fff" />
                              <Text style={styles.payNowText}>Pay Now</Text>
                            </TouchableOpacity>
                          )}
                          {debt.to === user?.id && (
                            <View style={styles.pendingActions}>
                              <View style={styles.remindBadge}>
                                <Text style={styles.remindText}>Pending</Text>
                              </View>
                              <TouchableOpacity
                                style={styles.markReceivedBtn}
                                onPress={() => {
                                  Alert.alert(
                                    'Confirm Payment Received',
                                    `Did you receive ₹${debt.amount.toLocaleString('en-IN')} from ${fromMember.name}?`,
                                    [
                                      { text: 'No', style: 'cancel' },
                                      {
                                        text: 'Yes, Received',
                                        onPress: () => {
                                          expenses.forEach(exp => {
                                            if (exp.paidBy.id === user?.id && !exp.settled.includes(debt.from) && exp.splitAmong.includes(debt.from)) {
                                              handleSettle(exp.id, debt.from);
                                            }
                                          });
                                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        },
                                      },
                                    ]
                                  );
                                }}
                                activeOpacity={0.7}
                              >
                                <Check size={12} color={colors.success} />
                                <Text style={styles.markReceivedText}>Mark Received</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.allSettledCard}>
                  <View style={styles.allSettledIcon}>
                    <Check size={28} color={colors.success} />
                  </View>
                  <Text style={styles.allSettledTitle}>All settled up!</Text>
                  <Text style={styles.allSettledSubtitle}>No pending payments in this group</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expense History</Text>
              {expenses.length > 0 ? expenses.map(exp => {
                const catInfo = CATEGORIES.find(c => c.id === exp.category);
                const isExpanded = expandedExpense === exp.id;
                const myShare = exp.splitAmong.includes(user?.id ?? '')
                  ? getPerPersonAmount(exp, user?.id ?? '')
                  : 0;

                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={styles.expenseCard}
                    onPress={() => setExpandedExpense(isExpanded ? null : exp.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expenseTop}>
                      <View style={styles.expenseLeft}>
                        <View style={[styles.expenseCatBadge, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={styles.expenseCatEmoji}>{catInfo?.emoji ?? '📦'}</Text>
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseTitle}>{exp.title}</Text>
                          <Text style={styles.expenseMeta}>
                            {exp.paidBy.name} paid · {new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={styles.expenseAmount}>₹{exp.amount.toLocaleString('en-IN')}</Text>
                        {myShare > 0 && (
                          <Text style={styles.expenseMyShare}>Your share: ₹{Math.round(myShare)}</Text>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={14} color={colors.textTertiary} />
                        ) : (
                          <ChevronDown size={14} color={colors.textTertiary} />
                        )}
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.expenseDetails}>
                        <View style={styles.splitTypeLabel}>
                          <Text style={styles.splitTypeLabelText}>
                            {exp.splitType === 'percentage' ? '% Split' : exp.splitType === 'custom' ? 'Custom Split' : 'Equal Split'}
                          </Text>
                          <Text style={styles.splitTypeLabelText}>
                            {exp.splitAmong.length} people
                          </Text>
                        </View>
                        {exp.splitAmong.map(memberId => {
                          const member = getMember(memberId);
                          if (!member) return null;
                          const share = getPerPersonAmount(exp, memberId);
                          const memberSettled = exp.settled.includes(memberId);
                          const isPayer = exp.paidBy.id === memberId;

                          return (
                            <View key={memberId} style={styles.detailRow}>
                              <Image source={{ uri: member.avatar }} style={styles.detailAvatar} />
                              <Text style={styles.detailName} numberOfLines={1}>
                                {member.id === user?.id ? 'You' : member.name}
                                {isPayer ? ' (paid)' : ''}
                              </Text>
                              <Text style={[
                                styles.detailAmount,
                                memberSettled ? styles.settledColor : isPayer ? styles.positiveText : styles.negativeText,
                              ]}>
                                {isPayer ? '' : memberSettled ? 'Settled' : `₹${Math.round(share)}`}
                              </Text>
                              {!isPayer && memberId === user?.id && !memberSettled && (
                                <TouchableOpacity
                                  style={styles.settleSmallBtn}
                                  onPress={() => {
                                    handlePay(exp.paidBy, Math.round(share));
                                  }}
                                >
                                  <CreditCard size={12} color={colors.white} />
                                  <Text style={styles.settleSmallText}>Pay</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }) : (
                <View style={styles.emptyState}>
                  <CircleDollarSign size={40} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No expenses yet</Text>
                  <Text style={styles.emptySubtitle}>Tap + to add your first expense</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Expense Modal */}
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
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <TouchableOpacity onPress={handleAddExpense}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.amountHero}>
                  <Text style={styles.amountHeroLabel}>Enter Amount</Text>
                  <View style={styles.amountHeroRow}>
                    <Text style={styles.amountHeroCurrency}>₹</Text>
                    <TextInput
                      style={styles.amountHeroInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      testID="expense-amount-input"
                    />
                  </View>
                  {parseFloat(amount) > 0 && activeSplitMembers.length > 0 && splitType === 'equal' && (
                    <Text style={styles.amountHeroSplit}>
                      ₹{perPersonSplit} per person · {activeSplitMembers.length} people
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Dinner at restaurant"
                    placeholderTextColor={colors.textTertiary}
                    testID="expense-title-input"
                  />
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
                  <Text style={styles.inputLabel}>Split Type</Text>
                  <View style={styles.splitTypeRow}>
                    <TouchableOpacity
                      style={[styles.splitTypeChip, splitType === 'equal' && styles.splitTypeChipActive]}
                      onPress={() => setSplitType('equal')}
                    >
                      <Equal size={14} color={splitType === 'equal' ? colors.primary : colors.textTertiary} />
                      <Text style={[styles.splitTypeText, splitType === 'equal' && styles.splitTypeTextActive]}>Equal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitTypeChip, splitType === 'custom' && styles.splitTypeChipActive]}
                      onPress={() => setSplitType('custom')}
                    >
                      <IndianRupee size={14} color={splitType === 'custom' ? colors.primary : colors.textTertiary} />
                      <Text style={[styles.splitTypeText, splitType === 'custom' && styles.splitTypeTextActive]}>Custom</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitTypeChip, splitType === 'percentage' && styles.splitTypeChipActive]}
                      onPress={() => setSplitType('percentage')}
                    >
                      <Percent size={14} color={splitType === 'percentage' ? colors.primary : colors.textTertiary} />
                      <Text style={[styles.splitTypeText, splitType === 'percentage' && styles.splitTypeTextActive]}>Percentage</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Split among</Text>
                  {circle.members.map(member => {
                    const isSelected = selectedMembers.length === 0 || selectedMembers.includes(member.id);
                    const isInSplit = activeSplitMembers.some(m => m.id === member.id);
                    return (
                      <View key={member.id} style={styles.memberSplitRow}>
                        <TouchableOpacity
                          style={styles.memberSelectArea}
                          onPress={() => toggleMember(member.id)}
                        >
                          <View style={[styles.memberCheckbox, isSelected && styles.memberCheckboxActive]}>
                            {isSelected && <Check size={12} color={colors.white} />}
                          </View>
                          <Image source={{ uri: member.avatar }} style={styles.memberRowAvatar} />
                          <Text style={styles.memberRowName}>
                            {member.id === user?.id ? 'You' : member.name}
                          </Text>
                        </TouchableOpacity>
                        {isInSplit && splitType === 'equal' && parseFloat(amount) > 0 && (
                          <Text style={styles.memberSplitAmount}>₹{perPersonSplit}</Text>
                        )}
                        {isInSplit && splitType === 'custom' && (
                          <View style={styles.customInputWrap}>
                            <Text style={styles.customInputPrefix}>₹</Text>
                            <TextInput
                              style={styles.customSplitInput}
                              value={customSplits[member.id] ?? ''}
                              onChangeText={(val) => setCustomSplits(prev => ({ ...prev, [member.id]: val }))}
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                              keyboardType="numeric"
                            />
                          </View>
                        )}
                        {isInSplit && splitType === 'percentage' && (
                          <View style={styles.customInputWrap}>
                            <TextInput
                              style={styles.customSplitInput}
                              value={customSplits[member.id] ?? ''}
                              onChangeText={(val) => setCustomSplits(prev => ({ ...prev, [member.id]: val }))}
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                              keyboardType="numeric"
                            />
                            <Text style={styles.customInputSuffix}>%</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* UPI Payment Modal */}
        <Modal
          visible={showPayModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.payModalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.payModalHeader}>
                <Text style={styles.payModalTitle}>Pay via UPI</Text>
                <TouchableOpacity onPress={() => setShowPayModal(false)}>
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {payTarget && (
                <View style={styles.payModalBody}>
                  <View style={styles.payAmountCard}>
                    <Text style={styles.payToLabel}>Paying to</Text>
                    <View style={styles.payToRow}>
                      <Image source={{ uri: payTarget.member.avatar }} style={styles.payToAvatar} />
                      <Text style={styles.payToName}>{payTarget.member.name}</Text>
                    </View>
                    <Text style={styles.payAmountBig}>₹{payTarget.amount.toLocaleString('en-IN')}</Text>
                  </View>

                  <Text style={styles.chooseAppLabel}>Choose UPI App</Text>
                  <View style={styles.upiAppsGrid}>
                    {UPI_APPS.map(app => (
                      <TouchableOpacity
                        key={app.id}
                        style={styles.upiAppBtn}
                        onPress={() => openUPIApp(app.scheme)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.upiAppIcon, { backgroundColor: app.color + '18' }]}>
                          <Text style={styles.upiAppEmoji}>{app.emoji}</Text>
                        </View>
                        <Text style={styles.upiAppName}>{app.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.markPaidBtn}
                    onPress={() => {
                      if (payTarget && user) {
                        Alert.alert(
                          'Confirm Payment',
                          `Are you sure you want to mark ₹${payTarget.amount.toLocaleString('en-IN')} to ${payTarget.member.name} as paid?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Yes, Mark as Paid',
                              onPress: () => {
                                expenses.forEach(exp => {
                                  if (exp.paidBy.id === payTarget.member.id && !exp.settled.includes(user.id) && exp.splitAmong.includes(user.id)) {
                                    handleSettle(exp.id, user.id);
                                  }
                                });
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert('Payment Recorded', `Your payment to ${payTarget.member.name} has been marked as settled.`);
                                setShowPayModal(false);
                              },
                            },
                          ]
                        );
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Check size={16} color={colors.primary} />
                    <Text style={styles.markPaidText}>Mark as Paid (without UPI)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 40 },

  heroCard: {
    margin: 16,
    borderRadius: 20,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    padding: 20,
  },
  heroStatBox: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  heroStatValue: { fontSize: 24, fontWeight: '700' as const, color: '#fff', marginTop: 4 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  heroBottom: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  heroInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  heroInfoText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  positiveText: { color: colors.success },
  negativeText: { color: colors.danger },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    position: 'relative' as const,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    width: (SCREEN_WIDTH - 48) / 2 - 4,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabText: { fontSize: 14, fontWeight: '500' as const, color: colors.textTertiary },
  tabTextActive: { color: colors.primary, fontWeight: '600' as const },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700' as const, color: colors.text, marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12, color: colors.textSecondary, marginBottom: 12,
  },

  splitCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  splitCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  splitAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitAvatarWrap: { alignItems: 'center' },
  splitAvatar: { width: 42, height: 42, borderRadius: 21 },
  youBadge: {
    position: 'absolute' as const,
    bottom: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#fff' },
  splitAmountSection: { alignItems: 'flex-end' },
  splitAmount: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  splitCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  splitDescription: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  splitNameBold: { fontWeight: '600' as const, color: colors.text },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payNowText: { fontSize: 13, fontWeight: '600' as const, color: '#fff' },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remindBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remindText: { fontSize: 12, fontWeight: '500' as const, color: colors.warning },
  markReceivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markReceivedText: { fontSize: 11, fontWeight: '600' as const, color: colors.success },

  allSettledCard: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  allSettledIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  allSettledTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  allSettledSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  expenseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseCatBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  expenseCatEmoji: { fontSize: 20 },
  expenseInfo: { marginLeft: 10, flex: 1 },
  expenseTitle: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  expenseMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', gap: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  expenseMyShare: { fontSize: 11, color: colors.textSecondary },

  expenseDetails: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  splitTypeLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  splitTypeLabelText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' as const },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  detailAvatar: { width: 28, height: 28, borderRadius: 14 },
  detailName: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '500' as const },
  detailAmount: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
  settledColor: { color: colors.success },
  settleSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settleSmallText: { fontSize: 11, fontWeight: '600' as const, color: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  saveText: { fontSize: 15, fontWeight: '600' as const, color: colors.primary },
  modalBody: { paddingHorizontal: 20 },

  amountHero: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  amountHeroLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' as const },
  amountHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  amountHeroCurrency: {
    fontSize: 32,
    fontWeight: '300' as const,
    color: colors.textTertiary,
    marginRight: 4,
  },
  amountHeroInput: {
    fontSize: 44,
    fontWeight: '700' as const,
    color: colors.text,
    minWidth: 60,
    textAlign: 'center' as const,
    padding: 0,
  },
  amountHeroSplit: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
    marginTop: 8,
  },

  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
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

  splitTypeRow: { flexDirection: 'row', gap: 8 },
  splitTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  splitTypeChipActive: { backgroundColor: colors.teal50, borderColor: colors.primary },
  splitTypeText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' as const },
  splitTypeTextActive: { color: colors.primary, fontWeight: '600' as const },

  memberSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberSelectArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  memberCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCheckboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  memberRowAvatar: { width: 32, height: 32, borderRadius: 16 },
  memberRowName: { fontSize: 14, fontWeight: '500' as const, color: colors.text },
  memberSplitAmount: {
    fontSize: 14, fontWeight: '600' as const, color: colors.primary,
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customInputPrefix: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' as const },
  customInputSuffix: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' as const },
  customSplitInput: {
    width: 60,
    padding: 6,
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center' as const,
  },

  payModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  payModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  payModalTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  payModalBody: { padding: 20 },
  payAmountCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  payToLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' as const },
  payToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  payToAvatar: { width: 36, height: 36, borderRadius: 18 },
  payToName: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  payAmountBig: { fontSize: 36, fontWeight: '700' as const, color: colors.primary },
  chooseAppLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  upiAppBtn: {
    alignItems: 'center',
    gap: 6,
  },
  upiAppIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiAppEmoji: { fontSize: 26 },
  upiAppName: { fontSize: 12, fontWeight: '500' as const, color: colors.text },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.teal50,
  },
  markPaidText: { fontSize: 14, fontWeight: '600' as const, color: colors.primary },
});
