import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Calendar, MapPin, Clock, Check, HelpCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { CircleEvent } from '@/types';

interface EventCardProps {
  event: CircleEvent;
  onRsvp: (status: 'yes' | 'maybe' | 'no') => void;
  currentUserId: string;
}

function EventCardComponent({ event, onRsvp, currentUserId }: EventCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentRsvp = event.rsvps.yes.includes(currentUserId)
    ? 'yes'
    : event.rsvps.maybe.includes(currentUserId)
    ? 'maybe'
    : event.rsvps.no.includes(currentUserId)
    ? 'no'
    : null;

  const handleRsvp = useCallback((status: 'yes' | 'maybe' | 'no') => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRsvp(status);
  }, [onRsvp]);

  const handleAddToCalendar = useCallback(() => {
    const startDate = new Date(`${event.date}T${convertTo24Hour(event.time)}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description ?? '');
    const location = encodeURIComponent(event.location ?? '');
    const startISO = startDate.toISOString().replace(/-|:|\.\d{3}/g, '');
    const endISO = endDate.toISOString().replace(/-|:|\.\d{3}/g, '');

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}&location=${location}`;

    Alert.alert(
      'Add to Calendar',
      'Open Google Calendar to add this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Calendar',
          onPress: () => {
            Linking.openURL(googleCalUrl).catch(() => {
              Alert.alert('Error', 'Could not open calendar. Please add the event manually.');
            });
          },
        },
      ]
    );
  }, [event]);

  const totalGoing = event.rsvps.yes.length;
  const totalMaybe = event.rsvps.maybe.length;

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
            <Clock size={13} color={colors.textTertiary} />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          {event.location ? (
            <View style={styles.detailRow}>
              <MapPin size={13} color={colors.textTertiary} />
              <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rsvpRow}>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'yes' && styles.rsvpBtnYes]}
            onPress={() => handleRsvp('yes')}
          >
            <Check size={14} color={currentRsvp === 'yes' ? colors.white : colors.success} />
            <Text style={[styles.rsvpText, currentRsvp === 'yes' && styles.rsvpTextActive]}>Going</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'maybe' && styles.rsvpBtnMaybe]}
            onPress={() => handleRsvp('maybe')}
          >
            <HelpCircle size={14} color={currentRsvp === 'maybe' ? colors.white : colors.warning} />
            <Text style={[styles.rsvpText, currentRsvp === 'maybe' && styles.rsvpTextActive]}>Maybe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpBtn, currentRsvp === 'no' && styles.rsvpBtnNo]}
            onPress={() => handleRsvp('no')}
          >
            <X size={14} color={currentRsvp === 'no' ? colors.white : colors.danger} />
            <Text style={[styles.rsvpText, currentRsvp === 'no' && styles.rsvpTextActive]}>{'Can\'t'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerRow}>
          {totalGoing > 0 && (
            <Text style={styles.goingText}>
              {totalGoing} going{totalMaybe > 0 ? ` · ${totalMaybe} maybe` : ''}
            </Text>
          )}
          <TouchableOpacity style={styles.calendarBtn} onPress={handleAddToCalendar}>
            <Calendar size={12} color={colors.primary} />
            <Text style={styles.calendarBtnText}>Add to Cal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function convertTo24Hour(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '12:00:00';
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${mins}:00`;
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

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateStrip: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coral50,
    borderRadius: 12,
    paddingVertical: 8,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.accent,
    letterSpacing: 1,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.textTertiary,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rsvpBtnYes: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  rsvpBtnMaybe: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  rsvpBtnNo: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  rsvpTextActive: {
    color: colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goingText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500' as const,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.teal50,
  },
  calendarBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.primary,
  },
});
