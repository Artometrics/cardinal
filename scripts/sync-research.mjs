#!/usr/bin/env node
/**
 * Snapshot close-reading notes, canon, and the Cardinal outline into the site.
 *
 * Usage (from the repo root):
 *   node scripts/sync-research.mjs
 *
 * Reads from CARDINAL_READING_DIR, or /workspace/cardinal-reading if that
 * exists, or the last committed copy at site/content/research-log/.
 * Does not modify the reading-directory source files.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = join(repoRoot, 'site');
const vendoredRoot = join(siteRoot, 'content', 'research-log');
const dataOut = join(siteRoot, 'src', 'data', 'research-log');
const shotOut = join(siteRoot, 'public', 'research-log', 'screenshots');
const bookRoot = join(repoRoot, 'books', 'cardinal');

const DEFAULT_READING = '/workspace/cardinal-reading';

function readingDir() {
  if (process.env.CARDINAL_READING_DIR) return resolve(process.env.CARDINAL_READING_DIR);
  if (existsSync(join(DEFAULT_READING, 'notes'))) return DEFAULT_READING;
  return vendoredRoot;
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(ext) && statSync(join(dir, name)).isFile())
    .sort();
}

function slugFromName(name) {
  return name.replace(/\.[^.]+$/, '');
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/\s*\{[^}]+\}\s*$/, '')
    .replace(/\*\*/g, '')
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function normHeader(h) {
  return h.trim().toLowerCase().replace(/[\s_]+/g, ' ');
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map(normHeader);
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] || '').trim();
    });
    return obj;
  });
}

function pick(obj, names) {
  for (const name of names) {
    if (obj[name]) return obj[name];
  }
  return '';
}

function splitPages(cite) {
  const pages = new Set();
  const re = /p+\.?\s*([ivxlcdm]+|\d+)(?:\s*[–-]\s*([ivxlcdm]+|\d+))?/gi;
  let m;
  while ((m = re.exec(cite))) {
    pages.add(m[1].toLowerCase());
    if (m[2]) pages.add(m[2].toLowerCase());
  }
  return [...pages];
}

function shotSrc(bookSlug, file) {
  return `/research-log/screenshots/${bookSlug}/${file}`;
}

function copyScreenshots(srcShots, inventory) {
  if (existsSync(shotOut)) rmSync(shotOut, { recursive: true });
  ensureDir(shotOut);
  if (!existsSync(srcShots)) return inventory;
  for (const book of readdirSync(srcShots)) {
    const dir = join(srcShots, book);
    if (!statSync(dir).isDirectory()) continue;
    ensureDir(join(shotOut, book));
    inventory[book] = [];
    for (const file of readdirSync(dir).sort()) {
      if (!/\.(png|jpe?g|webp|gif)$/i.test(file)) continue;
      copyFileSync(join(dir, file), join(shotOut, book, file));
      const page = file.replace(/\.[^.]+$/, '').replace(/^p/i, '');
      inventory[book].push({ page: page.toLowerCase(), file, src: shotSrc(book, file) });
    }
  }
  return inventory;
}

function imagesForCite(inventory, bookSlug, cite) {
  const shots = inventory[bookSlug] || [];
  const pages = splitPages(cite);
  if (!pages.length) return [];
  return shots.filter((s) => pages.includes(String(s.page).toLowerCase()));
}

function section(markdown, headingRe) {
  const re = new RegExp(`^###\\s+${headingRe}\\s*$`, 'im');
  const m = markdown.match(re);
  if (!m) return '';
  const start = m.index + m[0].length;
  const rest = markdown.slice(start);
  const end = rest.search(/^#{1,3}\s+/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

function bullets(text) {
  return unwrap(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(- |\* |\d+\.\s)/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim());
}

function cleanCite(value) {
  return String(value || '')
    .split(/Drive file|Local:|Citation scheme:/)[0]
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\*+/g, '')
    .replace(/[.\s]+$/, '');
}

function unwrap(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const start = /^(#{1,6}\s|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(line) || line.trim() === '' || line.trim() === '---';
    if (start || !out.length) out.push(line);
    else out[out.length - 1] = `${out[out.length - 1]} ${line.trim()}`;
  }
  return out.join('\n');
}

function sanitizePublic(text) {
  return String(text || '')
    .replace(/Drive file `[^`]+`[ \t]*(\([^)]*\))?[ \t]*\.?[ \t]*/g, '')
    .replace(/Local:[ \t]*`[^`]+`(?:[ \t]*→[ \t]*`[^`]+`)?[ \t]*\.?[ \t]*/g, '')
    .replace(/\/workspace\/[^\s`)]+/g, '')
    .replace(/`\s*`/g, '')
    .replace(/live in \./gi, 'are filed with the close-reading screenshots.');
}

function tableRows(text) {
  const lines = text.split('\n').filter((l) => l.startsWith('|'));
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim());
  return lines.slice(2).map((line) => {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] || '';
    });
    return row;
  });
}

function parseSessions(markdown, bookSlug, bookTitle) {
  const sessions = [];
  const re = /^##\s+(Run\s+(\d+)\s+[—-]\s+(\d{4}-\d{2}-\d{2})\b(.*))\s*$/gim;
  const matches = [...markdown.matchAll(re)];
  matches.forEach((m, i) => {
    const start = m.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    const body = markdown.slice(start, end);
    const heading = m[4].trim();
    const pages = heading.replace(/^\s*[—-]\s*/, "").replace(/^\([^)]+\)\s*[—-]\s*/, "").trim() || heading;
    const quotes = section(body, 'Quotes worth using.*') || '';
    const contradictions = section(body, 'CONTRADICTIONS.*') || '';
    const highlights = [];
    highlights.push(heading);
    const quoteCount = bullets(quotes).length;
    const contraCount = bullets(contradictions).length;
    if (quoteCount) highlights.push(`${quoteCount} verbatim quotes saved`);
    if (contraCount) highlights.push(`${contraCount} draft contradictions flagged`);
    const events = tableRows(section(body, 'Dated events') || '');
    events.slice(0, 5).forEach((row) => {
      const date = row.Date || row.date || '';
      const event = row.Event || row.event || '';
      if (date && event) highlights.push(`${date}: ${event}`);
    });
    if (events.length === 0) {
      for (const m of body.matchAll(/^###\s+(.+)$/gm)) {
        const title = m[1].trim();
        if (/^Chapter|^Books|^CONTRADICTIONS|^Content/i.test(title)) highlights.push(title);
      }
    }
    sessions.push({
      id: `${bookSlug}-run-${m[2]}`,
      date: m[3],
      bookSlug,
      bookTitle,
      heading: m[1].trim(),
      pagesCovered: pages,
      highlights,
    });
  });
  return sessions;
}

function parseNote(slug, markdown, inventory) {
  markdown = sanitizePublic(markdown);
  const title = cleanTitle((markdown.match(/^#\s+(.+)$/m) || [, slug])[1]);
  const book = cleanCite((markdown.match(/\*\*Book:\*\*\s*(.+)/) || [, ''])[1]);
  const citationScheme = (markdown.match(/\*\*Citation scheme:\*\*\s*([\s\S]+?)(?:\n\n|\nPrior )/) || [, ''])[1]
    .replace(/\s+/g, ' ')
    .trim();
  const sessions = parseSessions(markdown, slug, book || title);
  return {
    slug,
    title,
    book,
    citation: book,
    citationScheme,
    markdown,
    images: inventory[slug] || [],
    sessionIds: sessions.map((s) => s.id),
    sessions,
  };
}

function vendorNotes(srcNotes) {
  const dest = join(vendoredRoot, 'notes');
  ensureDir(dest);
  for (const file of readdirSync(dest)) {
    if (file.endsWith('.md')) rmSync(join(dest, file));
  }
  const files = listFiles(srcNotes, '.md');
  for (const file of files) {
    writeFileSync(join(dest, file), sanitizePublic(read(join(srcNotes, file))));
  }
  return files;
}

function deriveCanonFromNotes(notes, inventory) {
  const rows = [];
  for (const note of notes) {
    const contra = section(note.markdown, 'CONTRADICTIONS.*');
    const unclear = section(note.markdown, 'Unclear / to verify');
    bullets(contra).forEach((text, i) => {
      const topic = (text.match(/\*\*([^*]+)\*\*/) || [, `Contradiction ${i + 1}`])[1];
      const cites = (text.match(/p+\.?\s*[\divxlcdm]+(?:\s*[–-]\s*[\divxlcdm]+)?/gi) || []).join('; ');
      const status = /STRONG/i.test(text) ? 'disputed' : /fix/i.test(text) ? 'corrected' : 'disputed';
      rows.push({
        id: `${note.slug}-contra-${i + 1}`,
        status,
        topic: topic.replace(/:$/, ''),
        fact: text.replace(/\*\*/g, ''),
        sources: note.citation || note.title,
        resolution: 'From close-reading notes. Official Canon sheet not yet written.',
        cites,
        images: imagesForCite(inventory, note.slug, text).map((s) => s.src),
        draftLocations: (text.match(/`[^`]+`/g) || []).map((s) => s.slice(1, -1)).join('; '),
        origin: 'notes',
      });
    });
    bullets(unclear).forEach((text, i) => {
      const cites = (text.match(/p+\.?\s*[\divxlcdm]+(?:\s*[–-]\s*[\divxlcdm]+)?/gi) || []).join('; ');
      rows.push({
        id: `${note.slug}-unclear-${i + 1}`,
        status: 'disputed',
        topic: 'Unclear / to verify',
        fact: text.replace(/\*\*/g, ''),
        sources: note.citation || note.title,
        resolution: 'Flagged in notes; not yet settled.',
        cites,
        images: imagesForCite(inventory, note.slug, text).map((s) => s.src),
        draftLocations: '',
        origin: 'notes',
      });
    });
  }
  return rows;
}

function shotsFromText(inventory, text) {
  const found = [];
  const seen = new Set();
  const re = /(?:screenshots\/)?([a-z0-9-]+)\/(p[\w.]+\.(?:png|jpe?g|webp))/gi;
  let m;
  const raw = String(text || '');
  while ((m = re.exec(raw))) {
    const src = shotSrc(m[1], m[2]);
    if (!seen.has(src)) {
      seen.add(src);
      found.push(src);
    }
  }
  for (const [book, shots] of Object.entries(inventory)) {
    for (const shot of imagesForCite(inventory, book, raw)) {
      if (!seen.has(shot.src)) {
        seen.add(shot.src);
        found.push(shot.src);
      }
    }
  }
  return found;
}

function loadCanon(srcDir, notes, inventory, gaps) {
  const csvPath = join(srcDir, 'canon.csv');
  if (!existsSync(csvPath)) {
    gaps.push('canon.csv is not in the reading folder yet. Canon rows below are derived from the close-reading notes and should be replaced when the official sheet lands.');
    return {
      source: 'derived-from-notes',
      missingOfficialSheet: true,
      rows: deriveCanonFromNotes(notes, inventory),
    };
  }
  const objects = csvToObjects(read(csvPath));
  const rows = objects.map((obj, i) => {
    const fact = pick(obj, ['claim as settled', 'fact', 'claim', 'text', 'finding']);
    const supporting = pick(obj, ['supporting sources', 'sources', 'source']);
    const disagreeing = pick(obj, ['disagreeing sources', 'disagreement']);
    const resolution = pick(obj, ['resolution reasoning', 'resolution', 'ruling', 'decision', 'why']);
    const cites = pick(obj, ['cites', 'cite', 'pages', 'page']) || supporting;
    const statusRaw = pick(obj, ['status']).toLowerCase();
    const status = /settl/.test(statusRaw)
      ? 'settled'
      : /correct/.test(statusRaw)
        ? 'corrected'
        : 'disputed';
    const blob = Object.values(obj).join(' ');
    return {
      id: pick(obj, ['fact id', 'id']) || `canon-${i + 1}`,
      status,
      topic: pick(obj, ['topic', 'claim', 'title']),
      fact,
      sources: supporting,
      disagreeingSources: disagreeing,
      resolution,
      cites: cites,
      date: pick(obj, ['date']),
      people: pick(obj, ['people']),
      place: pick(obj, ['place']),
      images: shotsFromText(inventory, blob),
      draftLocations: pick(obj, ['draft', 'draft locations', 'locations']),
      draftFixNeeded: pick(obj, ['draft fix needed']),
      lastChecked: pick(obj, ['last checked']),
      origin: 'canon.csv',
    };
  });
  return { source: 'canon.csv', missingOfficialSheet: false, rows };
}

function deriveFixes(notes) {
  const items = [];
  for (const note of notes) {
    const contra = section(note.markdown, 'CONTRADICTIONS.*');
    bullets(contra).forEach((text, i) => {
      items.push({
        id: `${note.slug}-fix-${i + 1}`,
        text: text.replace(/\*\*/g, ''),
        bookSlug: note.slug,
        bookTitle: note.book || note.title,
        status: "pending Kyle's approval",
      });
    });
  }
  return items;
}

function loadFixes(srcDir, notes, gaps) {
  const path = join(srcDir, 'canon-fixes.md');
  const pending = "pending Kyle's approval";
  if (!existsSync(path)) {
    gaps.push("canon-fixes.md is not in the reading folder yet. The list below is taken from the notes' draft contradictions and is marked pending Kyle's approval.");
    return { source: 'derived-from-notes', pendingLabel: pending, markdown: '', items: deriveFixes(notes) };
  }
  const markdown = sanitizePublic(read(path));
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const rawItems = headings.length ? headings : bullets(markdown);
  const items = rawItems.map((text, i) => ({
    id: `fix-${i + 1}`,
    text: text.replace(/\*\*/g, ''),
    bookSlug: '',
    bookTitle: '',
    status: pending,
  }));
  return { source: 'canon-fixes.md', pendingLabel: pending, markdown, items };
}

function parseQuartoParts() {
  const yml = read(join(bookRoot, '_quarto.yml'));
  const parts = [];
  let current = null;
  let intro = null;
  const appendices = [];
  const lines = yml.split('\n');
  let inAppendices = false;
  for (const raw of lines) {
    const line = raw.trim();
    const part = line.match(/^-\s+part:\s*"([^"]+)"/);
    if (part) {
      current = { name: part[1], chapters: [] };
      parts.push(current);
      inAppendices = false;
      continue;
    }
    const ch = line.match(/^-\s+(ch\/[^\s]+\.qmd)/);
    if (ch && current) {
      current.chapters.push(ch[1]);
      continue;
    }
    const introMatch = line.match(/^-\s+(introduction\.qmd|index\.qmd)$/);
    if (introMatch && introMatch[1] === 'introduction.qmd') intro = introMatch[1];
    if (line.startsWith('appendices:')) inAppendices = true;
    const ap = line.match(/^-\s+(appendix-[^\s]+\.qmd|references\.qmd)$/);
    if (ap && inAppendices) appendices.push(ap[1]);
  }
  return { parts, intro, appendices };
}

function chapterTitle(rel) {
  const path = join(bookRoot, rel);
  if (!existsSync(path)) return cleanTitle(rel);
  const text = read(path);
  const heading = text.match(/^#\s+(.+)$/m);
  return cleanTitle(heading ? heading[1] : rel);
}

function parseOutlineByFile() {
  const path = join(bookRoot, '_project', 'outline.md');
  const byFile = {};
  const sections = [];
  if (!existsSync(path)) return { byFile, sections, mechanism: [], framingClaim: '', architectureNote: '' };
  const text = read(path);
  const architectureNote = (
    text.match(/The original Act I[\s\S]+?companion\nvolume \*Dawn\*\.[^\n]+/) ||
    text.match(/Cardinal is four acts[^\n]+/) ||
    [, '']
  )[0].replace(/\s+/g, ' ').trim();
  const mechanismBlock = text.split('## The Mechanism')[1]?.split('## The Framing Claim')[0] || '';
  const mechanism = bullets(mechanismBlock);
  for (const line of unwrap(mechanismBlock).split('\n').map((l) => l.trim())) {
    if (/^(Stated once|Rail controlled|\*\*Rail controlled)/.test(line)) mechanism.push(line.replace(/^\*\*|\*\*$/g, ''));
  }
  const framing = (text.split('## The Framing Claim')[1] || '').split('---')[0];
  const framingClaim = framing
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = text.split(/^## /m).slice(1);
  for (const chunk of chunks) {
    const titleLine = chunk.split('\n')[0].trim();
    if (!/^ACT\s+/i.test(titleLine) && !/Introduction/i.test(titleLine)) continue;
    const subtitle = (chunk.match(/^###\s+(.+)$/m) || [, ''])[1].trim();
    const theme = (chunk.match(/\*\*Act theme:\*\*\s*([\s\S]*?)(?:\n\n|\n\*\*)/) || [, ''])[1]
      .replace(/\s+/g, ' ')
      .trim();
    const landing = (chunk.match(/\*\*Act [IVX]+ lands on:\*\*\s*([\s\S]*?)(?:\n\n|\n---)/) ||
      chunk.match(/\*\*Act I lands on:\*\*\s*([\s\S]*?)(?:\n\n|\n---)/) || [, ''])[1]
      .replace(/\s+/g, ' ')
      .trim();
    const questions = bullets((chunk.split('**Core questions**')[1] || '').split('**Act')[0]);
    const files = [...chunk.matchAll(/`?(ch\/[a-z0-9-]+\.qmd)`?/g)].map((m) => m[1]);
    const rows = tableRows(chunk);
    const datesByFile = {};
    for (const row of rows) {
      const file = (row.File || row.file || '').replace(/`/g, '').trim();
      const dates = row.Dates || row.dates || '';
      const title = (row.Chapter || row.chapter || '').replace(/\*\*/g, '');
      if (file) datesByFile[file] = { dates, title, file };
    }
    const section = { titleLine, subtitle, theme, landing, questions, files, datesByFile };
    sections.push(section);
    for (const file of files) {
      byFile[file] = { ...datesByFile[file], theme, landing, questions, subtitle, outlineHeading: titleLine };
    }
  }
  return { byFile, sections, mechanism, framingClaim, architectureNote };
}

function slugPart(name) {
  return name
    .toLowerCase()
    .replace(/act\s+[ivx]+\s*[—-]\s*/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseResearchLogClaims() {
  const path = join(bookRoot, '_project', 'research-log.md');
  if (!existsSync(path)) return [];
  const text = read(path);
  const claims = [];
  const blocks = text.split(/^### /m).slice(1);
  for (const block of blocks) {
    const heading = block.split('\n')[0].trim();
    const act = (heading.match(/Act\s+([IVX]+)/i) || [, ''])[1];
    const rows = tableRows(block);
    for (const row of rows) {
      claims.push({
        act,
        heading,
        claim: row.Claim || row.claim || '',
        status: row.Status || row.status || '',
        source: row.Source || row.source || '',
      });
    }
  }
  return claims;
}

function romanToActIndex(roman) {
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  return map[roman] || 0;
}

function loadProgress(srcDir) {
  const path = join(srcDir, 'progress.json');
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(read(path));
    const books = data.queue || data.books || data || [];
    if (!Array.isArray(books)) return [];
    return books.map((b) => ({
      slug: b.slug || '',
      title: b.title || '',
      author: b.author || '',
      status: b.status || '',
      folder: b.folder || '',
    }));
  } catch {
    return [];
  }
}

function sourceSummary(note) {
  const connections = bullets(section(note.markdown, 'Connections to Cardinal people / threads'));
  const quotes = bullets(section(note.markdown, 'Quotes worth using.*')).map((q) => {
    const page = (q.match(/p+\.?\s*[\divxlcdm]+(?:\s*[–-]\s*[\divxlcdm]+)?/i) || [, ''])[0];
    return { text: q, page, images: imagesForCite({ [note.slug]: note.images }, note.slug, q).map((s) => s.src) };
  });
  const facts = [];
  tableRows(section(note.markdown, 'Dated events') || '')
    .slice(0, 8)
    .forEach((row) => {
      const date = row.Date || '';
      const event = row.Event || '';
      const page = row.Page || '';
      if (event) facts.push([date, event, page].filter(Boolean).join(' — '));
    });
  bullets(section(note.markdown, 'Money figures')).forEach((b) => facts.push(b));
  const argues = [];
  const firstPara = note.markdown.split(/^##\s+/m)[0];
  if (note.book) argues.push(`Close reading of ${note.book.replace(/\s+/g, ' ')}`);
  if (connections[0]) argues.push(connections[0].replace(/^\d+\.\s*/, ''));
  else argues.push('Gap: the notes do not yet state a one-line argument for this source.');
  return {
    slug: note.slug,
    title: cleanCite(note.book).replace(/^[^,]+,\s*/, '') || note.title,
    author: (note.book.match(/^([^,]+),/) || [, ''])[1].replace(/\*/g, '').trim(),
    citation: cleanCite(note.citation),
    status: 'read',
    argues,
    keyFacts: facts,
    bestQuotes: quotes,
    connects: connections,
    gaps: bullets(section(note.markdown, 'Unclear / to verify')),
  };
}

function peopleFromNotes(notes) {
  const people = [];
  for (const note of notes) {
    bullets(section(note.markdown, 'People.*')).forEach((line) => {
      const name = (line.match(/\*\*([^*]+)\*\*/) || [, ''])[1].trim();
      if (!name) return;
      people.push({
        name: name.replace(/\s+—.*$/, ''),
        note: line.replace(/\*\*/g, ''),
        cite: (line.match(/p+\.?\s*[\divxlcdmIVXLCDM0-9]+(?:\s*[–-]\s*[\divxlcdmIVXLCDM0-9]+)?(?:(?:,\s*p+\.?\s*[\divxlcdmIVXLCDM0-9]+(?:\s*[–-]\s*[\divxlcdmIVXLCDM0-9]+)?)|(?:,\s*\d+))* /g) || []).join('; ') || line,
        source: cleanCite(note.citation || note.title),
        slug: note.slug,
      });
    });
  }
  people.sort((a, b) => a.name.localeCompare(b.name));
  return people;
}

function timelineFromNotes(notes) {
  const events = [];
  for (const note of notes) {
    tableRows(section(note.markdown, 'Dated events') || '').forEach((row) => {
      if (!(row.Event || row.Date)) return;
      events.push({
        date: row.Date || row.date || '',
        event: row.Event || row.event || '',
        cite: row.Page || row.page || '',
        source: cleanCite(note.citation || note.title),
        slug: note.slug,
      });
    });
  }
  return events;
}

function buildStudy(notes, inventory, claims, progress, gaps) {
  const quarto = parseQuartoParts();
  const outline = parseOutlineByFile();
  const parts = quarto.parts.map((part, idx) => {
    const files = part.chapters;
    const firstMeta = outline.byFile[files[0]] || {};
    const chapters = files.map((file) => {
      const meta = outline.byFile[file] || {};
      const id = file.replace(/^ch\//, '').replace(/\.qmd$/, '');
      return {
        id,
        file,
        title: cleanTitle(meta.title) || chapterTitle(file),
        dates: meta.dates || '',
        href: `/research/${file.replace(/\.qmd$/, '')}`,
      };
    });
    const subtitleDates = (firstMeta.subtitle || '').match(/\(([^)]*\d[^)]*)\)/);
    const dateRange = chapters.map((c) => c.dates).filter(Boolean);
    const slug = slugPart(part.name);
    const actNumber = idx + 1;
    const relatedClaims = claims.filter((c) => romanToActIndex(c.act) === actNumber);
    const keyPeople = [];
    const keyDates = [];
    const keyMoney = [];
    const takeaways = [];
    const partGaps = [];
    if (firstMeta.theme) takeaways.push({ text: firstMeta.theme, source: 'Locked outline (act theme)' });
    if (firstMeta.landing) takeaways.push({ text: firstMeta.landing, source: 'Locked outline (act landing)' });
    if (idx === 1) {
      // Act II Hoover: attach Whyte notes
      for (const note of notes) {
        peopleFromNotes([note]).slice(0, 12).forEach((p) => keyPeople.push({ name: p.name, note: p.note, cite: p.cite }));
        timelineFromNotes([note]).forEach((e) => keyDates.push({ date: e.date, event: e.event, cite: e.cite }));
        bullets(section(note.markdown, 'Money figures')).forEach((m) => keyMoney.push({ text: m, cite: '', source: note.title }));
        connectionsTakeaways(note).forEach((t) => takeaways.push(t));
      }
    }
    relatedClaims
      .filter((c) => /VERIFIED/i.test(c.status))
      .slice(0, 8)
      .forEach((c) => {
        if (/\d/.test(c.claim) && /(\$|£|million|percent|%)/i.test(c.claim)) {
          keyMoney.push({ text: c.claim, cite: c.source, source: `Manuscript research log — ${c.heading}` });
        }
        keyDates.push({ date: '', event: c.claim, cite: c.source });
      });
    if (!keyPeople.length) partGaps.push('No close-reading people list for this part yet.');
    if (!keyDates.length) partGaps.push('No close-reading dated events for this part yet.');
    if (!keyMoney.length) partGaps.push('No close-reading money figures for this part yet.');
    if (takeaways.length < 5) {
      firstMeta.questions?.slice(0, 8 - takeaways.length).forEach((q) => {
        takeaways.push({ text: `Core question from the locked outline: ${q}`, source: 'Locked outline (core questions)' });
      });
    }
    if (!notes.length || (idx !== 1 && !relatedClaims.length)) {
      partGaps.push('Close reading of sources for this part has not started, or has not been filed in the notes folder.');
    }
    while (takeaways.length > 8) takeaways.pop();
    if (takeaways.length < 5) {
      partGaps.push('Fewer than five sourced takeaways are on file for this part.');
    }
    return {
      slug,
      name: part.name,
      subtitle: firstMeta.subtitle || '',
      dates: subtitleDates ? subtitleDates[1] : (dateRange[0] && dateRange[dateRange.length - 1] ? `${dateRange[0]} – ${dateRange[dateRange.length - 1]}` : dateRange[0] || ''),
      theme: firstMeta.theme || '',
      mechanism: firstMeta.theme || '',
      landing: firstMeta.landing || '',
      questions: firstMeta.questions || [],
      chapters,
      keyPeople,
      keyDates,
      keyMoney,
      takeaways,
      gaps: partGaps,
    };
  });

  if (outline.architectureNote) {
    gaps.push(
      `The master outline file still uses older Act II–V section headings for the material that _quarto.yml now calls Acts I–IV. ${outline.architectureNote} Study Guide pages use the current four-act names from _quarto.yml and attach themes by chapter file, not by the outdated heading numbers.`,
    );
  }

  const sources = notes.map(sourceSummary);
  const queued = progress.filter((b) => b.slug && !sources.some((s) => s.slug === b.slug));
  for (const book of queued) {
    sources.push({
      slug: book.slug,
      title: book.title,
      author: book.author,
      citation: [book.author, book.title].filter(Boolean).join(', '),
      status: book.status || 'queued',
      argues: [],
      keyFacts: [],
      bestQuotes: [],
      connects: [],
      gaps: ['Close reading has not been filed for this source yet.'],
    });
  }

  const intro = quarto.intro
    ? {
        id: 'introduction',
        file: 'introduction.qmd',
        title: chapterTitle('introduction.qmd'),
        dates: '',
        href: '/research/introduction',
      }
    : null;

  return {
    outline: {
      title: 'Cardinal — The Stanford Corridor',
      architectureNote: outline.architectureNote,
      mechanism: outline.mechanism,
      framingClaim: outline.framingClaim,
      introduction: intro,
      parts: parts.map((p) => ({
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        dates: p.dates,
        theme: p.theme,
        landing: p.landing,
        chapters: p.chapters,
      })),
      appendices: quarto.appendices.map((file) => ({
        file,
        title: chapterTitle(file),
        href: `/research/${file.replace(/\.qmd$/, '')}`,
      })),
      gaps,
    },
    parts,
    sources,
    people: peopleFromNotes(notes),
    timeline: timelineFromNotes(notes),
  };
}

function connectionsTakeaways(note) {
  return bullets(section(note.markdown, 'Connections to Cardinal people / threads'))
    .slice(0, 6)
    .map((text) => ({ text: text.replace(/^\d+\.\s*/, '').replace(/\*\*/g, ''), source: note.title }));
}

function main() {
  const src = readingDir();
  const gaps = [];
  const srcNotes = existsSync(join(src, 'notes')) ? join(src, 'notes') : join(vendoredRoot, 'notes');
  const srcShots = existsSync(join(src, 'screenshots')) ? join(src, 'screenshots') : join(vendoredRoot, 'screenshots');

  if (!existsSync(srcNotes)) {
    throw new Error(`No notes directory found at ${srcNotes}`);
  }

  const inventory = {};
  copyScreenshots(srcShots, inventory);
  const noteFiles = src === vendoredRoot ? listFiles(srcNotes, '.md') : vendorNotes(srcNotes);

  if (src !== vendoredRoot) {
    // Keep a copy of progress for source inventory if present, but never rewrite the source folder.
    if (existsSync(join(src, 'canon.csv'))) {
      copyFileSync(join(src, 'canon.csv'), join(vendoredRoot, 'canon.csv'));
    }
    if (existsSync(join(src, 'canon-fixes.md'))) {
      writeFileSync(join(vendoredRoot, 'canon-fixes.md'), sanitizePublic(read(join(src, 'canon-fixes.md'))));
    }
  }

  const rawNotes = noteFiles.map((file) => {
    const slug = slugFromName(file);
    const markdown = src === vendoredRoot ? read(join(srcNotes, file)) : sanitizePublic(read(join(srcNotes, file)));
    return parseNote(slug, markdown, inventory);
  });
  const citedInventory = {};
  for (const note of rawNotes) {
    const cites = [note.markdown, note.citationScheme].join('\n');
    const pages = new Set(splitPages(cites));
    citedInventory[note.slug] = (inventory[note.slug] || []).filter((shot) => pages.has(String(shot.page).toLowerCase()));
  }
  // Keep only cited page images in public/
  if (existsSync(shotOut)) rmSync(shotOut, { recursive: true });
  ensureDir(shotOut);
  for (const [book, shots] of Object.entries(citedInventory)) {
    ensureDir(join(shotOut, book));
    for (const shot of shots) {
      const from = join(srcShots, book, shot.file);
      if (existsSync(from)) copyFileSync(from, join(shotOut, book, shot.file));
    }
  }
  const notes = rawNotes.map((note) => ({
    ...note,
    images: citedInventory[note.slug] || [],
  }));

  const sessions = notes.flatMap((n) => n.sessions).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const canon = loadCanon(src, notes, inventory, gaps);
  const fixes = loadFixes(src, notes, gaps);
  const claims = parseResearchLogClaims();
  const progress = loadProgress(src);
  const studyGaps = [];
  const study = buildStudy(notes, inventory, claims, progress, studyGaps);

  const publicNotes = notes.map(({ sessions: _s, ...rest }) => rest);

  writeJson(join(dataOut, 'manifest.json'), {
    syncedAt: new Date().toISOString(),
    source: existsSync(join(DEFAULT_READING, 'notes')) && src === DEFAULT_READING ? 'reading-dir' : 'vendored',
    sourcePresent: existsSync(srcNotes),
    gaps,
    counts: {
      notes: notes.length,
      sessions: sessions.length,
      canon: canon.rows.length,
      fixes: fixes.items.length,
      parts: study.parts.length,
      sources: study.sources.length,
      screenshots: Object.values(inventory).reduce((n, arr) => n + arr.length, 0),
    },
  });
  writeJson(join(dataOut, 'notes.json'), publicNotes);
  writeJson(join(dataOut, 'sessions.json'), sessions);
  writeJson(join(dataOut, 'canon.json'), canon);
  writeJson(join(dataOut, 'fixes.json'), fixes);
  writeJson(join(dataOut, 'study-outline.json'), study.outline);
  writeJson(join(dataOut, 'study-parts.json'), study.parts);
  writeJson(join(dataOut, 'study-sources.json'), study.sources);
  writeJson(join(dataOut, 'study-people.json'), study.people);
  writeJson(join(dataOut, 'study-timeline.json'), study.timeline);

  console.log(`Synced research log from ${src}`);
  console.log(
    `  ${notes.length} notes, ${sessions.length} sessions, ${canon.rows.length} canon rows, ${fixes.items.length} fixes, ${study.parts.length} parts, ${study.sources.length} sources`,
  );
  if (gaps.length) {
    console.log('Gaps:');
    for (const gap of gaps) console.log(`  - ${gap}`);
  }
}

main();
