import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { Circle, Post, Poll, CircleEvent, BoardItem, Notification, Expense, Comment } from '@/types';
import { trpc, isBackendAvailable } from '@/lib/trpc';
import { useUser } from '@/providers/UserProvider';

const STORAGE_KEYS = {
  circles: 'huddle_circles',
  posts: 'huddle_posts',
  polls: 'huddle_polls',
  events: 'huddle_events',
  board: 'huddle_board',
  notifications: 'huddle_notifications',
  expenses: 'huddle_expenses',
};

export const [CirclesProvider, useCircles] = createContextHook(() => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [events, setEvents] = useState<CircleEvent[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const { user } = useUser();
  const userId = user?.id ?? '';

  const backendEnabled = isBackendAvailable && !!userId;

  const circlesQuery = trpc.circles.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );
  const postsQuery = trpc.posts.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );
  const pollsQuery = trpc.polls.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );
  const eventsQuery = trpc.events.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );
  const boardQuery = trpc.board.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );
  const notifsQuery = trpc.notifications.list.useQuery(
    { userId },
    { enabled: backendEnabled, retry: 1, staleTime: 5000 }
  );

  const localDataQuery = useQuery({
    queryKey: ['localCirclesData'],
    queryFn: async () => {
      const [sc, sp, spl, se, sb, sn, sex] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.circles),
        AsyncStorage.getItem(STORAGE_KEYS.posts),
        AsyncStorage.getItem(STORAGE_KEYS.polls),
        AsyncStorage.getItem(STORAGE_KEYS.events),
        AsyncStorage.getItem(STORAGE_KEYS.board),
        AsyncStorage.getItem(STORAGE_KEYS.notifications),
        AsyncStorage.getItem(STORAGE_KEYS.expenses),
      ]);
      return {
        circles: sc ? JSON.parse(sc) : [],
        posts: sp ? JSON.parse(sp) : [],
        polls: spl ? JSON.parse(spl) : [],
        events: se ? JSON.parse(se) : [],
        board: sb ? JSON.parse(sb) : [],
        notifications: sn ? JSON.parse(sn) : [],
        expenses: sex ? JSON.parse(sex) : [],
      };
    },
  });

  useEffect(() => {
    if (localDataQuery.data && !dataLoaded) {
      setCircles(localDataQuery.data.circles);
      setPosts(localDataQuery.data.posts);
      setPolls(localDataQuery.data.polls);
      setEvents(localDataQuery.data.events);
      setBoardItems(localDataQuery.data.board);
      setNotifications(localDataQuery.data.notifications);
      setExpenses(localDataQuery.data.expenses);
      setDataLoaded(true);
      console.log('[CirclesProvider] Loaded local data');
    }
  }, [localDataQuery.data, dataLoaded]);

  useEffect(() => {
    if (circlesQuery.data && userId) {
      const backendCircles = circlesQuery.data as Circle[];
      if (backendCircles.length > 0 || circles.length === 0) {
        setCircles(backendCircles);
        AsyncStorage.setItem(STORAGE_KEYS.circles, JSON.stringify(backendCircles));
      }
    }
  }, [circlesQuery.data, userId]);

  useEffect(() => {
    if (postsQuery.data && userId) {
      const backendPosts = postsQuery.data as Post[];
      if (backendPosts.length > 0 || posts.length === 0) {
        setPosts(backendPosts);
        AsyncStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(backendPosts));
      }
    }
  }, [postsQuery.data, userId]);

  useEffect(() => {
    if (pollsQuery.data && userId) {
      const backendPolls = pollsQuery.data as Poll[];
      if (backendPolls.length > 0 || polls.length === 0) {
        setPolls(backendPolls);
        AsyncStorage.setItem(STORAGE_KEYS.polls, JSON.stringify(backendPolls));
      }
    }
  }, [pollsQuery.data, userId]);

  useEffect(() => {
    if (eventsQuery.data && userId) {
      const backendEvents = eventsQuery.data as CircleEvent[];
      if (backendEvents.length > 0 || events.length === 0) {
        setEvents(backendEvents);
        AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(backendEvents));
      }
    }
  }, [eventsQuery.data, userId]);

  useEffect(() => {
    if (boardQuery.data && userId) {
      const backendBoard = boardQuery.data as BoardItem[];
      if (backendBoard.length > 0 || boardItems.length === 0) {
        setBoardItems(backendBoard);
        AsyncStorage.setItem(STORAGE_KEYS.board, JSON.stringify(backendBoard));
      }
    }
  }, [boardQuery.data, userId]);

  useEffect(() => {
    if (notifsQuery.data && userId) {
      const backendNotifs = notifsQuery.data as Notification[];
      if (backendNotifs.length > 0 || notifications.length === 0) {
        setNotifications(backendNotifs);
        AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(backendNotifs));
      }
    }
  }, [notifsQuery.data, userId]);

  const createCircleMutation = trpc.circles.create.useMutation();
  const createPostMutation = trpc.posts.create.useMutation();
  const toggleReactionMutation = trpc.posts.toggleReaction.useMutation();
  const togglePinMutation = trpc.posts.togglePin.useMutation();
  const createPollMutation = trpc.polls.create.useMutation();
  const votePollMutation = trpc.polls.vote.useMutation();
  const createEventMutation = trpc.events.create.useMutation();
  const rsvpEventMutation = trpc.events.rsvp.useMutation();
  const createBoardItemMutation = trpc.board.create.useMutation();
  const toggleBoardTodoMutation = trpc.board.toggleTodo.useMutation();
  const markNotifReadMutation = trpc.notifications.markRead.useMutation();
  const markAllNotifReadMutation = trpc.notifications.markAllRead.useMutation();
  const createNotifMutation = trpc.notifications.create.useMutation();

  const persistLocal = useCallback((key: string, value: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(value));
  }, []);

  const addCircle = useCallback((circle: Circle) => {
    setCircles(prev => {
      const updated = [circle, ...prev];
      persistLocal(STORAGE_KEYS.circles, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      createCircleMutation.mutate(
        { userId, circle },
        {
          onSuccess: () => console.log('[Backend] Circle created:', circle.name),
          onError: (err) => console.log('[Backend] Circle create error:', err.message),
        }
      );
    }
  }, [userId, createCircleMutation, persistLocal]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => {
      const updated = [post, ...prev];
      persistLocal(STORAGE_KEYS.posts, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      createPostMutation.mutate(
        { userId, post },
        {
          onSuccess: () => console.log('[Backend] Post created'),
          onError: (err) => console.log('[Backend] Post create error:', err.message),
        }
      );

      const circle = circles.find(c => c.id === post.circleId);
      if (circle) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          type: 'post',
          circleId: post.circleId,
          circleName: circle.name,
          circleEmoji: circle.emoji,
          title: 'New post',
          body: `${post.author.name} posted in ${circle.name}`,
          read: true,
          createdAt: new Date().toISOString(),
          actorName: post.author.name,
          actorAvatar: post.author.avatar,
        };
        setNotifications(prev => {
          const updated = [notif, ...prev];
          persistLocal(STORAGE_KEYS.notifications, updated);
          return updated;
        });
        if (isBackendAvailable) {
          createNotifMutation.mutate({ userId, notification: notif });
        }
      }
    }
  }, [userId, createPostMutation, persistLocal, circles]);

  const toggleReaction = useCallback((postId: string, emoji: string, reactUserId: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const currentVotes = p.reactions[emoji] || [];
        const hasVoted = currentVotes.includes(reactUserId);
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [emoji]: hasVoted
              ? currentVotes.filter(id => id !== reactUserId)
              : [...currentVotes, reactUserId],
          },
        };
      });
      persistLocal(STORAGE_KEYS.posts, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      toggleReactionMutation.mutate({ userId, postId, emoji, reactUserId });
    }
  }, [userId, toggleReactionMutation, persistLocal]);

  const togglePin = useCallback((postId: string) => {
    setPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId ? { ...p, pinned: !p.pinned } : p
      );
      persistLocal(STORAGE_KEYS.posts, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      togglePinMutation.mutate({ userId, postId });
    }
  }, [userId, togglePinMutation, persistLocal]);

  const addComment = useCallback((postId: string, comment: Comment) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, comments: [...p.comments, comment] };
      });
      persistLocal(STORAGE_KEYS.posts, updated);
      return updated;
    });
    console.log('[CirclesProvider] Comment added to post:', postId);
  }, [persistLocal]);

  const toggleCommentReaction = useCallback((postId: string, commentId: string, emoji: string, reactUserId: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id !== commentId) return c;
            const reactions = c.reactions ?? {};
            const currentVotes = reactions[emoji] || [];
            const hasVoted = currentVotes.includes(reactUserId);
            return {
              ...c,
              reactions: {
                ...reactions,
                [emoji]: hasVoted
                  ? currentVotes.filter(id => id !== reactUserId)
                  : [...currentVotes, reactUserId],
              },
            };
          }),
        };
      });
      persistLocal(STORAGE_KEYS.posts, updated);
      return updated;
    });
  }, [persistLocal]);

  const addPoll = useCallback((poll: Poll) => {
    setPolls(prev => {
      const updated = [poll, ...prev];
      persistLocal(STORAGE_KEYS.polls, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      createPollMutation.mutate(
        { userId, poll },
        {
          onSuccess: () => console.log('[Backend] Poll created'),
          onError: (err) => console.log('[Backend] Poll create error:', err.message),
        }
      );
    }
  }, [userId, createPollMutation, persistLocal]);

  const votePoll = useCallback((pollId: string, optionId: string, voterId: string) => {
    setPolls(prev => {
      const updated = prev.map(p => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map(o => ({
            ...o,
            votes: o.id === optionId
              ? o.votes.includes(voterId) ? o.votes.filter(id => id !== voterId) : [...o.votes, voterId]
              : o.votes.filter(id => id !== voterId),
          })),
        };
      });
      persistLocal(STORAGE_KEYS.polls, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      votePollMutation.mutate({ userId, pollId, optionId, voterId });
    }
  }, [userId, votePollMutation, persistLocal]);

  const closePoll = useCallback((pollId: string) => {
    setPolls(prev => {
      const updated = prev.map(p =>
        p.id === pollId ? { ...p, closed: true } : p
      );
      persistLocal(STORAGE_KEYS.polls, updated);
      return updated;
    });
    console.log('[CirclesProvider] Poll closed:', pollId);
  }, [persistLocal]);

  const addEvent = useCallback((event: CircleEvent) => {
    setEvents(prev => {
      const updated = [event, ...prev];
      persistLocal(STORAGE_KEYS.events, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      createEventMutation.mutate(
        { userId, event },
        {
          onSuccess: () => console.log('[Backend] Event created'),
          onError: (err) => console.log('[Backend] Event create error:', err.message),
        }
      );
    }
  }, [userId, createEventMutation, persistLocal]);

  const rsvpEvent = useCallback((eventId: string, attendeeId: string, status: 'yes' | 'maybe' | 'no') => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id !== eventId) return e;
        const rsvps = { ...e.rsvps };
        rsvps.yes = rsvps.yes.filter(id => id !== attendeeId);
        rsvps.maybe = rsvps.maybe.filter(id => id !== attendeeId);
        rsvps.no = rsvps.no.filter(id => id !== attendeeId);
        rsvps[status].push(attendeeId);
        return { ...e, rsvps };
      });
      persistLocal(STORAGE_KEYS.events, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      rsvpEventMutation.mutate({ userId, eventId, attendeeId, status });
    }
  }, [userId, rsvpEventMutation, persistLocal]);

  const addBoardItem = useCallback((item: BoardItem) => {
    setBoardItems(prev => {
      const updated = [item, ...prev];
      persistLocal(STORAGE_KEYS.board, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      createBoardItemMutation.mutate(
        { userId, item },
        {
          onSuccess: () => console.log('[Backend] Board item created'),
          onError: (err) => console.log('[Backend] Board item create error:', err.message),
        }
      );
    }
  }, [userId, createBoardItemMutation, persistLocal]);

  const toggleBoardTodo = useCallback((itemId: string) => {
    setBoardItems(prev => {
      const updated = prev.map(i =>
        i.id === itemId ? { ...i, completed: !i.completed } : i
      );
      persistLocal(STORAGE_KEYS.board, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      toggleBoardTodoMutation.mutate({ userId, itemId });
    }
  }, [userId, toggleBoardTodoMutation, persistLocal]);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => {
      const updated = [expense, ...prev];
      persistLocal(STORAGE_KEYS.expenses, updated);
      return updated;
    });
    console.log('[CirclesProvider] Expense added:', expense.title);
  }, [persistLocal]);

  const settleExpense = useCallback((expenseId: string, settledUserId: string) => {
    setExpenses(prev => {
      const updated = prev.map(e => {
        if (e.id !== expenseId) return e;
        if (e.settled.includes(settledUserId)) return e;
        return { ...e, settled: [...e.settled, settledUserId] };
      });
      persistLocal(STORAGE_KEYS.expenses, updated);
      return updated;
    });
  }, [persistLocal]);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      );
      persistLocal(STORAGE_KEYS.notifications, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      markNotifReadMutation.mutate({ userId, notifId });
    }
  }, [userId, markNotifReadMutation, persistLocal]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistLocal(STORAGE_KEYS.notifications, updated);
      return updated;
    });
    if (userId && isBackendAvailable) {
      markAllNotifReadMutation.mutate({ userId });
    }
  }, [userId, markAllNotifReadMutation, persistLocal]);

  const resetAllData = useCallback(async () => {
    setCircles([]);
    setPosts([]);
    setPolls([]);
    setEvents([]);
    setBoardItems([]);
    setNotifications([]);
    setExpenses([]);
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key))
    );
    console.log('[CirclesProvider] All data reset');
  }, []);

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

  const getCircleExpenses = useCallback((circleId: string) => {
    return expenses.filter(e => e.circleId === circleId);
  }, [expenses]);

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
    expenses,
    unreadCount,
    addCircle,
    addPost,
    addComment,
    toggleReaction,
    toggleCommentReaction,
    togglePin,
    addPoll,
    votePoll,
    closePoll,
    addEvent,
    rsvpEvent,
    addBoardItem,
    toggleBoardTodo,
    addExpense,
    settleExpense,
    markNotificationRead,
    markAllNotificationsRead,
    resetAllData,
    getCirclePosts,
    getCirclePolls,
    getCircleEvents,
    getCircleBoardItems,
    getCircleExpenses,
    getCircleById,
    isLoading: localDataQuery.isLoading,
  };
});
