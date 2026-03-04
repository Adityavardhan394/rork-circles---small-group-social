import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Circle, Post, Poll, CircleEvent, BoardItem, Notification } from '@/types';
import {
  MOCK_CIRCLES,
  MOCK_POSTS,
  MOCK_POLLS,
  MOCK_EVENTS,
  MOCK_BOARD_ITEMS,
  MOCK_NOTIFICATIONS,
} from '@/mocks/data';

const STORAGE_KEYS = {
  circles: 'circles_data',
  posts: 'circles_posts',
  polls: 'circles_polls',
  events: 'circles_events',
  board: 'circles_board',
  notifications: 'circles_notifications',
};

export const [CirclesProvider, useCircles] = createContextHook(() => {
  const [circles, setCircles] = useState<Circle[]>(MOCK_CIRCLES);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);
  const [events, setEvents] = useState<CircleEvent[]>(MOCK_EVENTS);
  const [boardItems, setBoardItems] = useState<BoardItem[]>(MOCK_BOARD_ITEMS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const queryClient = useQueryClient();

  const dataQuery = useQuery({
    queryKey: ['circlesData'],
    queryFn: async () => {
      const [storedCircles, storedPosts, storedPolls, storedEvents, storedBoard, storedNotifs] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.circles),
          AsyncStorage.getItem(STORAGE_KEYS.posts),
          AsyncStorage.getItem(STORAGE_KEYS.polls),
          AsyncStorage.getItem(STORAGE_KEYS.events),
          AsyncStorage.getItem(STORAGE_KEYS.board),
          AsyncStorage.getItem(STORAGE_KEYS.notifications),
        ]);
      return {
        circles: storedCircles ? JSON.parse(storedCircles) : null,
        posts: storedPosts ? JSON.parse(storedPosts) : null,
        polls: storedPolls ? JSON.parse(storedPolls) : null,
        events: storedEvents ? JSON.parse(storedEvents) : null,
        board: storedBoard ? JSON.parse(storedBoard) : null,
        notifications: storedNotifs ? JSON.parse(storedNotifs) : null,
      };
    },
  });

  useEffect(() => {
    if (dataQuery.data) {
      if (dataQuery.data.circles) setCircles(dataQuery.data.circles);
      if (dataQuery.data.posts) setPosts(dataQuery.data.posts);
      if (dataQuery.data.polls) setPolls(dataQuery.data.polls);
      if (dataQuery.data.events) setEvents(dataQuery.data.events);
      if (dataQuery.data.board) setBoardItems(dataQuery.data.board);
      if (dataQuery.data.notifications) setNotifications(dataQuery.data.notifications);
    }
  }, [dataQuery.data]);

  const persistMutation = useMutation({
    mutationFn: async (data: { key: string; value: unknown }) => {
      await AsyncStorage.setItem(data.key, JSON.stringify(data.value));
    },
  });

  const addCircle = useCallback((circle: Circle) => {
    setCircles(prev => {
      const updated = [circle, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.circles, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => {
      const updated = [post, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.posts, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const toggleReaction = useCallback((postId: string, emoji: string, userId: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const currentVotes = p.reactions[emoji] || [];
        const hasVoted = currentVotes.includes(userId);
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [emoji]: hasVoted
              ? currentVotes.filter(id => id !== userId)
              : [...currentVotes, userId],
          },
        };
      });
      persistMutation.mutate({ key: STORAGE_KEYS.posts, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const togglePin = useCallback((postId: string) => {
    setPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId ? { ...p, pinned: !p.pinned } : p
      );
      persistMutation.mutate({ key: STORAGE_KEYS.posts, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const addPoll = useCallback((poll: Poll) => {
    setPolls(prev => {
      const updated = [poll, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.polls, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const votePoll = useCallback((pollId: string, optionId: string, userId: string) => {
    setPolls(prev => {
      const updated = prev.map(p => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map(o => ({
            ...o,
            votes: o.id === optionId
              ? o.votes.includes(userId) ? o.votes.filter(id => id !== userId) : [...o.votes, userId]
              : o.votes.filter(id => id !== userId),
          })),
        };
      });
      persistMutation.mutate({ key: STORAGE_KEYS.polls, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const addEvent = useCallback((event: CircleEvent) => {
    setEvents(prev => {
      const updated = [event, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.events, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const rsvpEvent = useCallback((eventId: string, userId: string, status: 'yes' | 'maybe' | 'no') => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id !== eventId) return e;
        const rsvps = { ...e.rsvps };
        rsvps.yes = rsvps.yes.filter(id => id !== userId);
        rsvps.maybe = rsvps.maybe.filter(id => id !== userId);
        rsvps.no = rsvps.no.filter(id => id !== userId);
        rsvps[status].push(userId);
        return { ...e, rsvps };
      });
      persistMutation.mutate({ key: STORAGE_KEYS.events, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const addBoardItem = useCallback((item: BoardItem) => {
    setBoardItems(prev => {
      const updated = [item, ...prev];
      persistMutation.mutate({ key: STORAGE_KEYS.board, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const toggleBoardTodo = useCallback((itemId: string) => {
    setBoardItems(prev => {
      const updated = prev.map(i =>
        i.id === itemId ? { ...i, completed: !i.completed } : i
      );
      persistMutation.mutate({ key: STORAGE_KEYS.board, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      );
      persistMutation.mutate({ key: STORAGE_KEYS.notifications, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistMutation.mutate({ key: STORAGE_KEYS.notifications, value: updated });
      return updated;
    });
  }, [persistMutation]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const getCirclePosts = useCallback((circleId: string) => {
    return posts.filter(p => p.circleId === circleId);
  }, [posts]);

  const getCirclePolls = useCallback((circleId: string) => {
    return polls.filter(p => p.circleId === circleId);
  }, [polls]);

  const getCircleEvents = useCallback((circleId: string) => {
    return events.filter(e => e.circleId === circleId);
  }, [events]);

  const getCircleBoardItems = useCallback((circleId: string) => {
    return boardItems.filter(b => b.circleId === circleId);
  }, [boardItems]);

  const getCircleById = useCallback((circleId: string) => {
    return circles.find(c => c.id === circleId);
  }, [circles]);

  return {
    circles,
    posts,
    polls,
    events,
    boardItems,
    notifications,
    unreadCount,
    addCircle,
    addPost,
    toggleReaction,
    togglePin,
    addPoll,
    votePoll,
    addEvent,
    rsvpEvent,
    addBoardItem,
    toggleBoardTodo,
    markNotificationRead,
    markAllNotificationsRead,
    getCirclePosts,
    getCirclePolls,
    getCircleEvents,
    getCircleBoardItems,
    getCircleById,
    isLoading: dataQuery.isLoading,
  };
});
