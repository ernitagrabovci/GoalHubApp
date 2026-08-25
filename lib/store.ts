import { useSyncExternalStore } from 'react';

import { ALL_ACADEMY, ALL_DRILLS, ALL_INJURIES, ALL_RATINGS } from '@/lib/data';
import type { AcademyItem, Drill, Injury, Rating } from '@/lib/data';

type Listener = () => void;

export interface Collection<T extends { id: string }> {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T[];
  prepend: (item: T) => void;
  update: (id: string, updater: (item: T) => T) => void;
}

function createCollection<T extends { id: string }>(initial: T[]): Collection<T> {
  let items = initial;
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => items,
    prepend(item) {
      items = [item, ...items];
      emit();
    },
    update(id, updater) {
      items = items.map((it) => (it.id === id ? updater(it) : it));
      emit();
    },
  };
}

export function useCollection<T extends { id: string }>(c: Collection<T>): T[] {
  return useSyncExternalStore(c.subscribe, c.getSnapshot);
}

export const ratingsStore = createCollection<Rating>(ALL_RATINGS);
export const injuriesStore = createCollection<Injury>(ALL_INJURIES);
export const academyStore = createCollection<AcademyItem>(ALL_ACADEMY);
export const drillsStore = createCollection<Drill>(ALL_DRILLS);
