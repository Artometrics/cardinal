export const NAV: [string, string, string][] = [
  ['web', 'Web', '/'],
  ['people', 'People', '/people/'],
  ['family', 'Family', '/family/'],
  ['surnames', 'Surnames', '/surnames/'],
  ['places', 'Places', '/places/'],
  ['organisations', 'Organisations', '/organisations/'],
  ['charts', 'Charts', '/charts/'],
  ['import', 'Import', '/import/'],
  ['sources', 'Sources', '/sources/'],
];

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Canonical home for the integrated web route. */
export const WOP_HOME = '/web';
