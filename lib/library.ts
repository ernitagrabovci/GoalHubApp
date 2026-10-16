/**
 * Shared vocabulary for the trainer's library — the level chips, the category
 * list and the `file_type` labels, so the list and the two material forms
 * cannot drift apart.
 */

/** The level chip labels, mapped onto the level codes the API stores. */
export const LEVEL_TO_API: Record<string, string> = {
  Fillestar: 'beginner',
  Mesëm: 'intermediate',
  Avancuar: 'advanced',
};

/** The reverse — the API's level code under the label the screens show. */
export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Fillestar',
  intermediate: 'Mesëm',
  advanced: 'Avancuar',
};

/** The library's `file_type`, under the label the Lloji column shows. */
export const TYPE_LABEL: Record<string, string> = { mp4: 'Video', gif: 'Video', pdf: 'PDF' };

/** The levels the forms offer, in the order the pickers list them. */
export const LEVELS = ['Fillestar', 'Mesëm', 'Avancuar'];

/** The categories the forms offer — the API stores the label as free text. */
export const CATEGORIES = ['Teknika', 'Taktika', 'Fizike', 'Psikologjike'];

export const levelLabel = (value: string | null) => (value ? LEVEL_LABEL[value] ?? value : '—');

export const typeLabel = (value: string | null) =>
  value ? TYPE_LABEL[value] ?? value.toUpperCase() : '—';

/** The level code for a form label, falling back to `beginner`. */
export const levelCode = (label: string) => LEVEL_TO_API[label] ?? 'beginner';
