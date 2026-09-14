import { useLocalSearchParams } from 'expo-router';

import { PlayerForm } from '@/components/players/player-form';

/**
 * Edito lojtarin — same form as registration, titled with the player's name.
 * The players table still has placeholder rows, so this falls back to an
 * example player until the rows carry real data.
 */

const FALLBACK = { name: 'Narti Cerkini', team: 'Ekipi i Parë', nr: '1' };

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function EditPlayerScreen() {
  const params = useLocalSearchParams<{ name?: string; team?: string; nr?: string }>();

  const name = params.name ?? FALLBACK.name;
  const team = params.team ?? FALLBACK.team;
  const nr = params.nr ?? FALLBACK.nr;

  return (
    <PlayerForm
      title={name}
      subtitle={`${team} *Nr.${nr}`}
      avatarInitials={initialsOf(name)}
    />
  );
}
