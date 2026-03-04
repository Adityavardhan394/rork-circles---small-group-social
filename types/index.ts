export interface User {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export interface Circle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  members: User[];
  admins: string[];
  inviteCode: string;
  createdAt: string;
  lastActivity?: string;
  description?: string;
}

export interface Post {
  id: string;
  circleId: string;
  author: User;
  text?: string;
  mediaUrls: string[];
  reactions: Record<string, string[]>;
  comments: Comment[];
  createdAt: string;
  expiresAt: string;
  pinned: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
  mentions?: string[];
}

export interface Poll {
  id: string;
  circleId: string;
  author: User;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt: string;
  closed: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface CircleEvent {
  id: string;
  circleId: string;
  author: User;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  rsvps: {
    yes: string[];
    maybe: string[];
    no: string[];
  };
  createdAt: string;
}

export interface BoardItem {
  id: string;
  circleId: string;
  author: User;
  title: string;
  type: 'link' | 'note' | 'todo' | 'photo' | 'expense' | 'checklist';
  content: string;
  url?: string;
  completed?: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'post' | 'poll' | 'event' | 'invite' | 'reaction' | 'comment' | 'message' | 'expense';
  circleId: string;
  circleName: string;
  circleEmoji: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actorName: string;
  actorAvatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  circleId?: string;
  circleName?: string;
  circleEmoji?: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: string;
}

export interface Expense {
  id: string;
  circleId: string;
  title: string;
  amount: number;
  paidBy: User;
  splitAmong: string[];
  settled: string[];
  createdAt: string;
  category: 'food' | 'rent' | 'transport' | 'entertainment' | 'shopping' | 'other';
}

export type ThemeMode = 'light' | 'dark' | 'system';
