import React, { useState, useCallback } from 'react';
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
import { X, Plus, Trash2, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCircles } from '@/providers/CirclesProvider';
import { useUser } from '@/providers/UserProvider';
import { POLL_TEMPLATES } from '@/mocks/data';
import { Poll } from '@/types';
import CirclePicker from '@/components/CirclePicker';

export default function CreatePollScreen() {
  const { circleId: paramCircleId } = useLocalSearchParams<{ circleId: string }>();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(paramCircleId ?? null);
  const [step, setStep] = useState<'pick' | 'form'>(paramCircleId ? 'form' : 'pick');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const router = useRouter();
  const { circles, addPoll, getCircleById } = useCircles();
  const { user } = useUser();

  const circle = getCircleById(selectedCircleId ?? '');

  const handleAddOption = useCallback(() => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, '']);
  }, [options.length]);

  const handleRemoveOption = useCallback((index: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
  }, [options.length]);

  const handleOptionChange = useCallback((index: number, text: string) => {
    setOptions(prev => prev.map((o, i) => i === index ? text : o));
  }, []);

  const handleTemplate = useCallback((templateQuestion: string) => {
    setQuestion(templateQuestion);
  }, []);

  const handleCreate = useCallback(() => {
    if (!selectedCircleId) {
      Alert.alert('Select a huddle', 'Choose which huddle for this poll.');
      return;
    }
    if (!question.trim()) {
      Alert.alert('Question required', 'Ask your huddle something!');
      return;
    }
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      Alert.alert('Need options', 'Add at least 2 options for your poll.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      circleId: selectedCircleId,
      author: user!,
      question: question.trim(),
      options: validOptions.map((text, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: text.trim(),
        votes: [],
      })),
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      closed: false,
    };
    addPoll(newPoll);
    router.back();
  }, [question, options, selectedCircleId, addPoll, user, router]);

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

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Poll</Text>
            <TouchableOpacity
              style={[styles.nextBtn, !selectedCircleId && styles.nextBtnDisabled]}
              onPress={handleContinue}
              disabled={!selectedCircleId}
            >
              <Text style={[styles.nextBtnText, !selectedCircleId && styles.nextBtnTextDisabled]}>Next</Text>
              <ArrowRight size={16} color={!selectedCircleId ? Colors.textTertiary : Colors.white} />
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
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {circle ? `Poll in ${circle.emoji} ${circle.name}` : 'New Poll'}
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, !question.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!question.trim()}
          >
            <Text style={[styles.createBtnText, !question.trim() && styles.createBtnTextDisabled]}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.templateSection}>
            <Text style={styles.label}>Quick templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
              {POLL_TEMPLATES.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.templateChip}
                  onPress={() => handleTemplate(t.question)}
                >
                  <Text style={styles.templateEmoji}>{t.emoji}</Text>
                  <Text style={styles.templateLabel}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Your question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask something..."
              placeholderTextColor={Colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              maxLength={120}
              multiline
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Options</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={styles.optionDot}>
                  <Text style={styles.optionNumber}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={Colors.textTertiary}
                  value={option}
                  onChangeText={(text) => handleOptionChange(index, text)}
                  maxLength={60}
                />
                {options.length > 2 && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveOption(index)}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {options.length < 6 && (
              <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddOption}>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  nextBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  createBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  templateSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  templateRow: {
    gap: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateEmoji: {
    fontSize: 16,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  inputSection: {
    marginBottom: 24,
  },
  questionInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  optionInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtn: {
    padding: 6,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
});
