import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'administrator' | 'trainer' | 'player' | 'parent' | 'financier';

export type DemoUser = {
  role: Role;
  name: string;
  initials: string;
  email: string;
  club: string;
  subtitle: string;
  color: string;
};

/** Demo accounts mirroring the webapp seeders — UI preview only, no real backend. */
export const DEMO_USERS: Record<Role, DemoUser> = {
  administrator: {
    role: 'administrator',
    name: 'Ardian Dema',
    initials: 'AD',
    email: 'admin@fcprishtina.com',
    club: 'FC Prishtina',
    subtitle: 'Club administrator',
    color: '#1a9e5c',
  },
  trainer: {
    role: 'trainer',
    name: 'Rexhep Hyseni',
    initials: 'RH',
    email: 'rexhep@fcprishtina.com',
    club: 'FC Prishtina',
    subtitle: 'Head coach — First Team',
    color: '#2fbf71',
  },
  player: {
    role: 'player',
    name: 'Ardit Llapashtica',
    initials: 'AL',
    email: 'ardit@fcprishtina.com',
    club: 'FC Prishtina',
    subtitle: 'Forward · No. 9',
    color: '#f5a623',
  },
  parent: {
    role: 'parent',
    name: 'Besnik Gashi',
    initials: 'BG',
    email: 'besnik@gmail.com',
    club: 'FC Prishtina Academy',
    subtitle: 'Parent of Agon Gashi · No. 7',
    color: '#8f86e8',
  },
  financier: {
    role: 'financier',
    name: 'Faton Krasniqi',
    initials: 'FK',
    email: 'faton@fcprishtina.com',
    club: 'FC Prishtina',
    subtitle: 'Club financier',
    color: '#5aa7e6',
  },
};

export const ROLE_ORDER: Role[] = ['administrator', 'trainer', 'player', 'parent', 'financier'];

export const ROLE_LABELS: Record<Role, string> = {
  administrator: 'admin',
  trainer: 'trainer',
  player: 'player',
  parent: 'parent',
  financier: 'finance',
};

type SessionValue = {
  user: DemoUser | null;
  signIn: (role: Role) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      signIn: (role: Role) => setUser(DEMO_USERS[role]),
      signOut: () => setUser(null),
    }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
