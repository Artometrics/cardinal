import manifest from '../data/research-log/manifest.json';
import notes from '../data/research-log/notes.json';
import sessions from '../data/research-log/sessions.json';
import canon from '../data/research-log/canon.json';
import fixes from '../data/research-log/fixes.json';
import outline from '../data/research-log/study-outline.json';
import parts from '../data/research-log/study-parts.json';
import sources from '../data/research-log/study-sources.json';
import people from '../data/research-log/study-people.json';
import timeline from '../data/research-log/study-timeline.json';

export type Manifest = typeof manifest;
export type Note = (typeof notes)[number];
export type Session = (typeof sessions)[number];
export type Canon = typeof canon;
export type CanonRow = Canon['rows'][number];
export type Fixes = typeof fixes;
export type Outline = typeof outline;
export type Part = (typeof parts)[number];
export type Source = (typeof sources)[number];
export type Person = (typeof people)[number];
export type TimelineEvent = (typeof timeline)[number];

export function getManifest() {
  return manifest;
}

export function getNotes() {
  return notes;
}

export function getNote(slug: string) {
  const note = notes.find((n) => n.slug === slug);
  if (!note) throw new Error(`Unknown note: ${slug}`);
  return note;
}

export function getSessions() {
  return sessions;
}

export function getCanon() {
  return canon;
}

export function getFixes() {
  return fixes;
}

export function getOutline() {
  return outline;
}

export function getParts() {
  return parts;
}

export function getPart(slug: string) {
  const part = parts.find((p) => p.slug === slug);
  if (!part) throw new Error(`Unknown part: ${slug}`);
  return part;
}

export function getSources() {
  return sources;
}

export function getSource(slug: string) {
  const source = sources.find((s) => s.slug === slug);
  if (!source) throw new Error(`Unknown source: ${slug}`);
  return source;
}

export function getStudyPeople() {
  return people;
}

export function getStudyTimeline() {
  return timeline;
}
