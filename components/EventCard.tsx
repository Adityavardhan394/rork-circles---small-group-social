import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Clock, Check, HelpCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { CircleEvent } from '@/types';

interface EventCardProps {
  event: CircleEvent;
  onRsvp: (status: 'yes' | 'maybe' | 'no') => void;
  currentUserId: string;
}

function EventCardComponent({ event, onRsvp, currentUserId }: EventCardProps) {
  const currentRsvp = event.rsvps.yes.includes(currentUserId)
    ? 'yes'
    : event.rsvps.maybe.includes(currentUserId)
    ? 'maybe'
    : event.rsvps.no.includes(currentUserId)
    ? 'no'
    : null;

  const handleRsvp = useCallback((status: 'yes' | 'maybe' | 'no') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRsvp(status);
  }, [onRsvp]);

  const totalGoing = event.rsvps.yes.length;

  return (
    <View style={styles.card}>
      <View style={styles.dateStrip}>
        <Text style={styles.dateMonth}>{formatMonth(event.date)}</Text>
        <Text style={styles.dateDay}>{formatDay(event.date)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        {event.description ? (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        ) : null}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Clock size={13} color={Colors.textTertiary} />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          {event.location ? (
            <View style={styles.detailRow}>
              <MapPin size={13} color={Colors.textTertiary} />
              <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rsvpRow}>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'yes' && styles.rsvpBtnYes]}
            onPress={() => handleRsvp('yes')}
          >
            <Check size={14} color={currentRsvp === 'yes' ? Colors.white : Colors.success} />
            <Text style={[styles.rsvpText, currentRsvp === 'yes' && styles.rsvpTextActive]}>Going</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'maybe' && styles.rsvpBtnMaybe]}
            onPress={() => handleRsvp('maybe')}
          >
            <HelpCircle size={14} color={currentRsvp === 'maybe' ? Colors.white : Colors.warning} />
            <Text style={[styles.rsvpText, currentRsvp === 'maybe' && styles.rsvpTextActive]}>Maybe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'no' && styles.rsvpBtnNo]}
            onPress={() => handleRsvp('no')}
          >
            <X size={14} color={currentRsvp === 'no' ? Colors.white : Colors.danger} />
            <Text style={[styles.rsvpText, currentRsvp === 'no' && styles.rsvpTextActive]}>Can't</Text>
          </TouchableOpacity>
        </View>
        {totalGoing > 0 && (
          <Text style={styles.goingText}>{totalGoing} going</Text>
        )}
      </View>
    </View>
  );
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en', { month: 'short' }).toUpperCase();
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.getDate().toString();
}

export default React.memo(EventCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dateStrip: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.coral50,
    borderRadius: 12,
    paddingVertical: 8,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 1,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rsvpBtnYes: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  rsvpBtnMaybe: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  rsvpBtnNo: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  rsvpTextActive: {
    color: Colors.white,
  },
  goingText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '500' as const,
    marginTop: 6,
  },
});
