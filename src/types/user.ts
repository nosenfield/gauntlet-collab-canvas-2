import type { User as FirebaseUser } from 'firebase/auth';

export interface User {
  uid: string;
  color: string;
  displayName?: string;
}

export interface UserState {
  user: User | null;
  userColor: string;
  isLoading: boolean;
  error: string | null;
}

export { type FirebaseUser };
