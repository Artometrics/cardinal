import type { LedgerRow } from './load';
import artMap from '../data/timeline-art.json';

export type TimelineArt = {
  src: string;
  alt: string;
  caption: string;
  slug: string;
};

export function ledgerArtKey(row: Pick<LedgerRow, 'date' | 'event'>): string {
  return `${row.date}::${row.event}`;
}

export function artFor(row: Pick<LedgerRow, 'date' | 'event'>): TimelineArt | null {
  const entry = (artMap as Record<string, TimelineArt | undefined>)[ledgerArtKey(row)];
  return entry ?? null;
}
