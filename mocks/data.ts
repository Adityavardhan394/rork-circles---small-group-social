import { User, Circle, Post, Poll, CircleEvent, BoardItem, Notification } from '@/types';

function daysAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysFromNow(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function minutesAgo(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

export const CURRENT_USER: User = {
  id: 'user-1',
  name: 'Aditya',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  phone: '+91 98765 43210',
  bio: 'Building cool stuff in Hyderabad',
  createdAt: daysAgo(60),
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user-2',
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    createdAt: daysAgo(58),
  },
  {
    id: 'user-3',
    name: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    createdAt: daysAgo(55),
  },
  {
    id: 'user-4',
    name: 'Sneha',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    createdAt: daysAgo(52),
  },
  {
    id: 'user-5',
    name: 'Vikram',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    createdAt: daysAgo(50),
  },
  {
    id: 'user-6',
    name: 'Ananya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    createdAt: daysAgo(48),
  },
];

export const CIRCLE_COLORS = [
  '#0F766E', '#7C3AED', '#DC2626', '#2563EB', '#D97706', '#059669', '#DB2777', '#4F46E5',
];

export const MOCK_CIRCLES: Circle[] = [
  {
    id: 'circle-1',
    name: 'Flatmates HYD',
    emoji: '🏠',
    color: '#0F766E',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]],
    admins: ['user-1'],
    inviteCode: 'FLAT2024',
    createdAt: daysAgo(45),
    lastActivity: '2 min ago',
    description: 'Hitech City flatmates — rent, groceries, chaos',
  },
  {
    id: 'circle-2',
    name: 'Gym 6 AM',
    emoji: '💪',
    color: '#DC2626',
    members: [MOCK_USERS[0], MOCK_USERS[2], MOCK_USERS[4]],
    admins: ['user-1', 'user-3'],
    inviteCode: 'GYM6AM',
    createdAt: daysAgo(40),
    lastActivity: '15 min ago',
    description: 'Early risers only. No excuses.',
  },
  {
    id: 'circle-3',
    name: 'JNTU Batch 2023',
    emoji: '🎓',
    color: '#2563EB',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[3], MOCK_USERS[4], MOCK_USERS[5]],
    admins: ['user-1'],
    inviteCode: 'JNTU23',
    createdAt: daysAgo(50),
    lastActivity: '1 hr ago',
    description: 'JNTU CSE 2023 — placements, parties, memories',
  },
  {
    id: 'circle-4',
    name: 'Startup Bros',
    emoji: '🚀',
    color: '#7C3AED',
    members: [MOCK_USERS[0], MOCK_USERS[2], MOCK_USERS[4]],
    admins: ['user-1'],
    inviteCode: 'STARTBRO',
    createdAt: daysAgo(30),
    lastActivity: '3 hrs ago',
    description: 'T-Hub hustlers building the next big thing',
  },
  {
    id: 'circle-5',
    name: 'HYD Foodies',
    emoji: '🍜',
    color: '#D97706',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[5]],
    admins: ['user-2'],
    inviteCode: 'FOODHYD',
    createdAt: daysAgo(35),
    lastActivity: '5 hrs ago',
    description: 'Best biryani spots and chai discoveries',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    circleId: 'circle-1',
    author: MOCK_USERS[1],
    text: 'Who left the dishes in the sink again? 🙄',
    mediaUrls: [],
    reactions: { '😂': ['user-1', 'user-3'], '🙈': ['user-4'] },
    comments: [
      { id: 'c1', userId: 'user-3', userName: 'Rahul', userAvatar: MOCK_USERS[2].avatar, text: 'Not me 👀', createdAt: minutesAgo(25) },
    ],
    createdAt: minutesAgo(30),
    expiresAt: daysFromNow(3),
    pinned: false,
  },
  {
    id: 'post-2',
    circleId: 'circle-1',
    author: MOCK_USERS[0],
    text: 'Rent split for March — everyone owes ₹8,500. UPI by Friday please!',
    mediaUrls: [],
    reactions: { '👍': ['user-2', 'user-3', 'user-4'] },
    comments: [],
    createdAt: hoursAgo(4),
    expiresAt: daysFromNow(3),
    pinned: true,
  },
  {
    id: 'post-3',
    circleId: 'circle-2',
    author: MOCK_USERS[2],
    text: 'New PR on deadlift today! 120kg 🔥',
    mediaUrls: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop'],
    reactions: { '🔥': ['user-1', 'user-5'], '💪': ['user-1'] },
    comments: [
      { id: 'c2', userId: 'user-1', userName: 'Aditya', userAvatar: MOCK_USERS[0].avatar, text: 'Beast mode! 🦍', createdAt: hoursAgo(2) },
    ],
    createdAt: hoursAgo(3),
    expiresAt: daysFromNow(3),
    pinned: false,
  },
  {
    id: 'post-4',
    circleId: 'circle-3',
    author: MOCK_USERS[5],
    text: 'Anyone got notes for the DSA mock test? Need them ASAP 📚',
    mediaUrls: [],
    reactions: { '📝': ['user-1'] },
    comments: [
      { id: 'c3', userId: 'user-4', userName: 'Sneha', userAvatar: MOCK_USERS[3].avatar, text: 'Sending on WhatsApp', createdAt: hoursAgo(1) },
    ],
    createdAt: hoursAgo(2),
    expiresAt: daysFromNow(3),
    pinned: false,
  },
  {
    id: 'post-5',
    circleId: 'circle-5',
    author: MOCK_USERS[1],
    text: 'Found this amazing biryani place in Tolichowki! Must try 🍗',
    mediaUrls: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop'],
    reactions: { '🤤': ['user-1', 'user-6'], '❤️': ['user-1'] },
    comments: [],
    createdAt: hoursAgo(6),
    expiresAt: daysFromNow(3),
    pinned: false,
  },
];

export const MOCK_POLLS: Poll[] = [
  {
    id: 'poll-1',
    circleId: 'circle-1',
    author: MOCK_USERS[0],
    question: 'Movie night this Saturday?',
    options: [
      { id: 'o1', text: 'Dune Part 2 🏜️', votes: ['user-1', 'user-3'] },
      { id: 'o2', text: 'Deadpool 3 🗡️', votes: ['user-2'] },
      { id: 'o3', text: 'Skip this week 😴', votes: ['user-4'] },
    ],
    createdAt: hoursAgo(2),
    expiresAt: daysFromNow(1),
    closed: false,
  },
  {
    id: 'poll-2',
    circleId: 'circle-2',
    author: MOCK_USERS[4],
    question: 'Gym timing tomorrow?',
    options: [
      { id: 'o4', text: '6:00 AM ☀️', votes: ['user-1', 'user-5'] },
      { id: 'o5', text: '7:00 AM 🌤️', votes: ['user-3'] },
      { id: 'o6', text: 'Rest day 💤', votes: [] },
    ],
    createdAt: daysAgo(3),
    expiresAt: daysAgo(2),
    closed: true,
  },
];

export const MOCK_EVENTS: CircleEvent[] = [
  {
    id: 'event-1',
    circleId: 'circle-1',
    author: MOCK_USERS[0],
    title: 'House Party 🎉',
    description: 'BYOB! Bringing the speakers.',
    date: daysFromNow(5).split('T')[0],
    time: '8:00 PM',
    location: 'Our flat, Hitech City',
    rsvps: { yes: ['user-1', 'user-2'], maybe: ['user-3'], no: [] },
    createdAt: daysAgo(2),
  },
  {
    id: 'event-2',
    circleId: 'circle-3',
    author: MOCK_USERS[3],
    title: 'Batch Reunion Dinner',
    description: 'Let\'s catch up at Paradise Biryani',
    date: daysFromNow(12).split('T')[0],
    time: '7:30 PM',
    location: 'Paradise, Secunderabad',
    rsvps: { yes: ['user-1', 'user-4', 'user-6'], maybe: ['user-2'], no: ['user-5'] },
    createdAt: daysAgo(3),
  },
  {
    id: 'event-3',
    circleId: 'circle-2',
    author: MOCK_USERS[2],
    title: 'Sunday Long Run',
    description: '10K around KBR Park',
    date: daysFromNow(3).split('T')[0],
    time: '5:30 AM',
    location: 'KBR Park, Jubilee Hills',
    rsvps: { yes: ['user-3', 'user-5'], maybe: ['user-1'], no: [] },
    createdAt: daysAgo(1),
  },
];

export const MOCK_BOARD_ITEMS: BoardItem[] = [
  {
    id: 'board-1',
    circleId: 'circle-1',
    author: MOCK_USERS[0],
    title: 'Rent Split Sheet',
    type: 'link',
    content: 'Google Sheets link for March rent',
    url: 'https://sheets.google.com',
    createdAt: daysAgo(14),
  },
  {
    id: 'board-2',
    circleId: 'circle-1',
    author: MOCK_USERS[1],
    title: 'WiFi Password',
    type: 'note',
    content: 'Router: ACT_5G\nPassword: flatmates2024',
    createdAt: daysAgo(30),
  },
  {
    id: 'board-3',
    circleId: 'circle-1',
    author: MOCK_USERS[2],
    title: 'Buy groceries',
    type: 'todo',
    content: 'Milk, eggs, bread, coffee',
    completed: false,
    createdAt: hoursAgo(5),
  },
  {
    id: 'board-4',
    circleId: 'circle-3',
    author: MOCK_USERS[3],
    title: 'Placement Resources',
    type: 'link',
    content: 'Shared drive with all interview prep material',
    url: 'https://drive.google.com',
    createdAt: daysAgo(5),
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'post',
    circleId: 'circle-1',
    circleName: 'Flatmates HYD',
    circleEmoji: '🏠',
    title: 'New post',
    body: 'Priya shared a photo in Flatmates HYD',
    read: false,
    createdAt: minutesAgo(30),
    actorName: 'Priya',
    actorAvatar: MOCK_USERS[1].avatar,
  },
  {
    id: 'notif-2',
    type: 'reaction',
    circleId: 'circle-2',
    circleName: 'Gym 6 AM',
    circleEmoji: '💪',
    title: 'Reaction',
    body: 'Rahul reacted 🔥 to your post',
    read: false,
    createdAt: hoursAgo(3),
    actorName: 'Rahul',
    actorAvatar: MOCK_USERS[2].avatar,
  },
  {
    id: 'notif-3',
    type: 'event',
    circleId: 'circle-3',
    circleName: 'JNTU Batch 2023',
    circleEmoji: '🎓',
    title: 'New event',
    body: 'Sneha created "Batch Reunion Dinner" on Mar 30',
    read: true,
    createdAt: daysAgo(1),
    actorName: 'Sneha',
    actorAvatar: MOCK_USERS[3].avatar,
  },
  {
    id: 'notif-4',
    type: 'poll',
    circleId: 'circle-2',
    circleName: 'Gym 6 AM',
    circleEmoji: '💪',
    title: 'New poll',
    body: 'Vikram asks: "Gym timing tomorrow?"',
    read: true,
    createdAt: hoursAgo(1),
    actorName: 'Vikram',
    actorAvatar: MOCK_USERS[4].avatar,
  },
  {
    id: 'notif-5',
    type: 'comment',
    circleId: 'circle-1',
    circleName: 'Flatmates HYD',
    circleEmoji: '🏠',
    title: 'Comment',
    body: 'Rahul commented "Not me 👀" on your post',
    read: true,
    createdAt: hoursAgo(5),
    actorName: 'Rahul',
    actorAvatar: MOCK_USERS[2].avatar,
  },
];

export const POLL_TEMPLATES = [
  { emoji: '🎬', label: 'Movie night?', question: 'Movie night this weekend?' },
  { emoji: '🍽️', label: 'Dinner plans?', question: 'Where should we eat?' },
  { emoji: '⏰', label: 'When?', question: 'What time works for everyone?' },
  { emoji: '📍', label: 'Where?', question: 'Where should we meet?' },
  { emoji: '🙋', label: "Who's in?", question: "Who's in for this plan?" },
  { emoji: '🏋️', label: 'Workout?', question: 'Gym tomorrow?' },
];

export const CIRCLE_EMOJIS = ['🏠', '💪', '🎓', '🚀', '🍜', '🎮', '🎵', '📸', '⚽', '🎯', '🧘', '🍻', '✈️', '📚', '🎨', '🏄'];
