import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';

import { CircleEvent } from '@/types';
import CirclePicker from '@/components/CirclePicker';

export default function CreateEventScreen() {
  const { circleId: paramCircleId } = useLocalSearchParams<{ circleId: string }>();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(paramCircleId ?? null);
  const [step, setStep] = useState<'pick' | 'form'>(paramCircleId ? 'form' : 'pick');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();
  const { circles, addEvent, getCircleById } = useCircles();
  const { user } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circle = getCircleById(selectedCircleId ?? '');

  const handleCreate = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Choose which huddle for this event.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title required', 'Give your event a name!');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Date required', 'When is the event?');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newEvent: CircleEvent = {
      id: `event-${Date.now()}`,
      circleId: selectedCircleId,
      author: user!,
      title: title.trim(),
      description: description.trim() || undefined,
      date: date.trim(),
      time: time.trim() || 'TBD',
      location: location.trim() || undefined,
      rsvps: { yes: user ? [user.id] : [], maybe: [], no: [] },
      createdAt: new Date().toISOString(),
    };
    addEvent(newEvent);
    router.back();
  }, [title, description, date, time, location, selectedCircleId, addEvent, user, router]);

  const handleSelectCircle = useCallback((id: string) => {
    setSelectedCircleId(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Pick a huddle to continue.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep('form');
  }, [selectedCircleId]);

  const quickDates = [
    { label: 'Tomorrow', value: getDateString(1) },
    { label: 'This Sat', value: getNextSaturday() },
    { label: 'Next Week', value: getDateString(7) },
  ];

  const quickTimes = [
    { label: '6 AM', value: '6:00 AM' },
    { label: '12 PM', value: '12:00 PM' },
    { label: '6 PM', value: '6:00 PM' },
    { label: '8 PM', value: '8:00 PM' },
  ];

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Event</Text>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedCircleId && styles.nextBtnDisabled]}
              onPress={handleContinue}
              disabled={!selectedCircleId}
            >
              <Text style={[styles.nextBtnText, !selectedCircleId && styles.nextBtnTextDisabled]}>Next</Text>
              <ArrowRight size={16} color={!selectedCircleId ? colors.textTertiary : colors.white} />
            </TouchableOpacity>
          </View>
          <CirclePicker
            circles={circles}
            selectedCircleId={selectedCircleId}
            onSelect={handleSelectCircle}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => paramCircleId ? router.back() : setStep('pick')}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {circle ? `Event in ${circle.emoji} ${circle.name}` : 'New Event'}
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, !title.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!title.trim()}
          >
            <Text style={[styles.createBtnText, !title.trim() && styles.createBtnTextDisabled]}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>Event title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. House Party, Movie Night..."
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
              autoFocus
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's the plan?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
            />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.label}>Date</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              value={date}
              onChangeText={setDate}
            />
            <View style={styles.quickRow}>
              {quickDates.map((qd, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickChip, date === qd.value && styles.quickChipActive]}
                  onPress={() => setDate(qd.value)}
                >
                  <Text style={[styles.quickChipText, date === qd.value && styles.quickChipTextActive]}>
                    {qd.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.label}>Time</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. 7:00 PM"
              placeholderTextColor={colors.textTertiary}
              value={time}
              onChangeText={setTime}
            />
            <View style={styles.quickRow}>
              {quickTimes.map((qt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickChip, time === qt.value && styles.quickChipActive]}
                  onPress={() => setTime(qt.value)}
                >
                  <Text style={[styles.quickChipText, time === qt.value && styles.quickChipTextActive]}>
                    {qt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.label}>Location (optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Where is it?"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  nextBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  nextBtnTextDisabled: {
    color: colors.textTertiary,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  createBtnTextDisabled: {
    color: colors.textTertiary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.teal50,
    borderColor: colors.primary,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.primary,
  },
});
