import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as auth from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { toSessionUser } from '@/lib/api/mappers';
import { clearToken, getToken, setToken } from '@/lib/api/token-store';
import type { ApiClub, ApiUser } from '@/lib/api/types';

export type Role = 'administrator' | 'trainer' | 'player' | 'parent' | 'financier';

export type SessionUser = {
  id: number;
  role: Role;
  name: string;
  initials: string;
  email: string;
  club: string;
  subtitle: string;
  color: string;
};

export const ROLE_ORDER: Role[] = ['administrator', 'trainer', 'player', 'parent', 'financier'];

export const ROLE_LABELS: Record<Role, string> = {
  administrator: 'admin',
  trainer: 'trainer',
  player: 'player',
  parent: 'parent',
  financier: 'finance',
};

/** `loading` until the stored token has been checked on launch. */
export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type UpdateProfileInput = {
  name: string;
  email: string;
  password?: string;
  language?: 'sq' | 'en';
};

type SessionValue = {
  user: SessionUser | null;
  token: string | null;
  status: SessionStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  changePassword: (currentPassword: string, password: string) => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [club, setClub] = useState<ApiClub | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  // Restore a stored token on launch. A 401 means the token is dead, so drop
  // it; a network failure keeps it so the next launch can retry.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await getToken();
      if (!stored) {
        if (!cancelled) setStatus('signedOut');
        return;
      }

      try {
        const { user: apiUser, club: apiClub } = await auth.me(stored);
        if (cancelled) return;
        setTokenState(stored);
        setClub(apiClub);
        setUser(toSessionUser(apiUser, apiClub));
        setStatus('signedIn');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          await clearToken();
        }
        setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await auth.login(email, password);
    await setToken(result.token);
    setTokenState(result.token);
    setClub(result.club);
    setUser(toSessionUser(result.user, result.club));
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(() => {
    const current = token;
    setUser(null);
    setClub(null);
    setTokenState(null);
    setStatus('signedOut');
    clearToken().catch(() => {});
    if (current) auth.logout(current).catch(() => {});
  }, [token]);

  const updateProfile = useCallback(
    async ({ name, email, password, language }: UpdateProfileInput) => {
      if (!token || !user) throw new ApiError('You are not signed in.', 401);

      const nextName = name.trim();
      const nextEmail = email.trim();
      const emailChanged = nextEmail !== '' && nextEmail !== user.email;

      if (emailChanged && !password) {
        throw new ApiError('Enter your password to change your email.', 422);
      }

      let apiUser: ApiUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: null,
      };

      if (nextName && (nextName !== user.name || language !== undefined)) {
        apiUser = (await auth.updateProfile(token, nextName, language)).user;
      }
      if (emailChanged) {
        apiUser = (await auth.updateEmail(token, nextEmail, password as string)).user;
      }

      setUser(toSessionUser(apiUser, club));
    },
    [token, user, club]
  );

  const changePassword = useCallback(
    async (currentPassword: string, password: string) => {
      if (!token) throw new ApiError('You are not signed in.', 401);
      await auth.changePassword(token, currentPassword, password);
    },
    [token]
  );

  const value = useMemo<SessionValue>(
    () => ({ user, token, status, signIn, signOut, updateProfile, changePassword }),
    [user, token, status, signIn, signOut, updateProfile, changePassword]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
