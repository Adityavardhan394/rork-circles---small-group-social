import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link2, StickyNote, CheckSquare, ImageIcon, Square, CheckSquare2, DollarSign, ListChecks } from 'lucide-react-native';
import { useTheme, type ColorScheme } from '@/providers/ThemeProvider';
import { BoardItem } from '@/types';

interface BoardItemCardProps {
  item: BoardItem;
  onToggleTodo?: () => void;
}

const TYPE_ICONS: Record<string, typeof Link2> = {
  link: Link2,
  note: StickyNote,
  todo: CheckSquare,
  photo: ImageIcon,
  expense: DollarSign,
  checklist: ListChecks,
};

const TYPE_COLORS: Record<string, string> = {
  link: '#2563EB',
  note: '#D97706',
  todo: '#059669',
  photo: '#DB2777',
  expense: '#F97316',
  checklist: '#7C3AED',
};

function BoardItemCardComponent({ item, onToggleTodo }: BoardItemCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const Icon = TYPE_ICONS[item.type];
  const color = TYPE_COLORS[item.type];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={item.type === 'todo' ? onToggleTodo : undefined}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        {item.type === 'todo' ? (
          item.completed ? (
            <CheckSquare2 size={18} color={color} />
          ) : (
            <Square size={18} color={color} />
          )
        ) : (
          <Icon size={18} color={color} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, item.completed && styles.titleCompleted]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.contentText} numberOfLines={2}>{item.content}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(BoardItemCardComponent);

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  contentText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
