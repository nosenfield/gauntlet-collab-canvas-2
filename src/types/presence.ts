import type { Point } from './canvas';

export interface PresenceData {
  userId: string;
  color: string;
  cursor: Point;
  timestamp: number;
  isActive: boolean;
}

export interface PresenceState {
  otherUsers: PresenceData[];
  isLoading: boolean;
  error: string | null;
}
