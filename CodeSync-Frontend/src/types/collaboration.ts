export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isHost: boolean;
  isOnline: boolean;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  line: number;
  column: number;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface RoomPermissions {
  canEdit: boolean;
  canExecute: boolean;
  canChat: boolean;
  canVideo: boolean;
  canAudio: boolean;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  language: string;
  hostId: string;
  participants: User[];
  permissions: RoomPermissions;
  createdAt: Date;
}

export interface CodeVersion {
  id: string;
  roomId: string;
  code: string;
  savedBy: string;
  savedAt: Date;
  description?: string;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed?: number;
}

export type Language = 'java' | 'python';

export const CURSOR_COLORS = [
  'hsl(142 71% 45%)',   // Green
  'hsl(262 83% 58%)',   // Purple
  'hsl(199 89% 48%)',   // Blue
  'hsl(45 93% 47%)',    // Yellow
  'hsl(340 82% 52%)',   // Pink
  'hsl(25 95% 53%)',    // Orange
];

export const LANGUAGE_OPTIONS: { value: Language; label: string; extension: string }[] = [
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'python', label: 'Python', extension: 'py' },
];
