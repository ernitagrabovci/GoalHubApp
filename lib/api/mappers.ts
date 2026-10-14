import type { Role, SessionUser } from '@/lib/session';
import type { ApiClub, ApiRole, ApiUser } from '@/lib/api/types';

/** Presentation defaults the profile screen reads off the session user. */
const ROLE_META: Record<Role, { color: string; subtitle: string }> = {
  administrator: { color: '#1a9e5c', subtitle: 'Club administrator' },
  trainer: { color: '#2fbf71', subtitle: 'Head coach' },
  player: { color: '#f5a623', subtitle: 'Player' },
  parent: { color: '#8f86e8', subtitle: 'Parent' },
  financier: { color: '#5aa7e6', subtitle: 'Club financier' },
};

/** Backend roles the app has no dedicated UI for collapse into `trainer`. */
const ROLE_MAP: Record<ApiRole, Role> = {
  administrator: 'administrator',
  trainer: 'trainer',
  assistant_trainer: 'trainer',
  technical_staff: 'trainer',
  player: 'player',
  parent: 'parent',
  financier: 'financier',
};

export function mapRole(role: string): Role {
  return ROLE_MAP[role as ApiRole] ?? 'player';
}

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function toSessionUser(apiUser: ApiUser, club: ApiClub | null): SessionUser {
  const role = mapRole(apiUser.role);
  const meta = ROLE_META[role];

  return {
    id: apiUser.id,
    role,
    name: apiUser.name,
    initials: initialsFromName(apiUser.name),
    email: apiUser.email,
    club: club?.name ?? '',
    subtitle: meta.subtitle,
    color: meta.color,
  };
}
