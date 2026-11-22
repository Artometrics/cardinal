# Cardinal Expansion Plan

*Filed 21 November 2026, America/Los_Angeles. A plan only: no site build, no image generation, no live deploy. Drawn from Kyle's notes that day (glossary pages, a navigable timeline, interludes, book gaps, the East Coast sister book, and Mayhem episode ideas).*

Each idea is filed to an existing container. Unverified claims are marked **to-verify**. Interpretive frames are marked as questions, not findings.

---

## 1. Glossary / entity system

**Ask:** one page per person, institution, place, and node, with a bio, its own timeline, its beats across the story, sources, and tabs: Bio / Timeline / Beats / Sources / Connections. Example: Steinbeck's page should show his beats, not require a scroll through the master ledger.

### What already exists

There are already three overlapping layers. Do not add a fourth dataset. Extend these.

| Surface | What it is | Counts (as of this file) | Individual pages? |
|---|---|---|---|
| `/people` | Names split from the `actors` column of `books/cardinal/_project/event-ledger.csv` | 139 unique actor strings: about 93 persons and 46 institutions or collectives, across 139 events (128 VERIFIED, 7 NEEDS SOURCE, 4 CONTESTED) | No. One filterable table. |
| `/places` | Ledger `location` strings, with a map where `site/src/data/geo.json` has coordinates | 61 unique location strings; 22 pinned; 39 unpinned (compounds and regions); 21 Commons photographs | No. Map plus list. |
| `/study/people` and `/study/timeline` | Extracts from close-reading notes (`study-people.json`, `study-timeline.json`) | 22 people; 40 dated notes, almost all from Whyte | No. Study lists only, not the full ledger. |
| `/web/people/[id]`, `/web/places/[id]`, `/web/organisations/[id]` | Web of People profiles (`site/data/web-of-people/dataset.json`) | 234 people, 109 places, 21 organisations, 255 events, 245 relationships, 68 affiliations, 13 repo sources, 196 web sources | Yes. Sections already include a short role line, Timeline, Family, Connections, Places, Organisations, and Sources. No Bio essay, no Beats tab, and no tabs UI. |

The Web of People dataset is richer than the ledger (family and research-expanded names). It still leaves 65 ledger actor strings unmapped, many of them institutions (`US Congress`, `Six Companies`, `Stanford trustees`) or collectives that belong in the glossary as nodes. Bios are thin: a `role` string, not a sourced summary. The 21 orgs include Stanford, the Hoover Institution, the CRB, Bechtel, Fairchild, Google, and Palantir.

The public story spine is the eight documentary parts in `story-so-far.md` (The Ledger through The Open Era). The manuscript outline is five acts. The Study Guide uses four acts that map onto manuscript Acts II–V. Glossary "beats" should follow the eight parts, so a reader can ask "where is Steinbeck in this?" and get parts, not a 139-card scroll. Steinbeck already has two ledger rows (leaves Stanford without a degree, 1925; *The Harvest Gypsies*, 1936-10-05) and a Study Guide chapter, "The Witness Who Did Not Graduate."

### Proposed data shape

One entity record, many views. Canonical chronology remains the ledger. Web of People remains the relationship graph.

```text
Entity
  id, slug, type: person | org | place | node
  name, shortRole
  bio            // 1–3 sourced paragraphs; new writing, not invented
  ledgerRows[]   // keys into event-ledger.csv (actors or location)
  webId?         // link to the Web of People record when one exists
  parts[]        // documentary parts 1–8 in which this entity appears
  sources[]
  connections[]  // reuse Web of People relationships where they exist
```

No parallel event list. An entity timeline is a filter of the master ledger, plus, where useful, the extra Web of People events, each still carrying its cite.

### Proposed routes

- Keep `/web/*` as the graph profiles.
- Add a Study Guide glossary that is the readable face of the same records:
  - `/study/glossary` — A–Z index, filterable by type
  - `/study/glossary/[slug]` — tabs: Bio / Timeline / Beats / Sources / Connections
- Upgrade `/people` and `/places` from dead-end indexes into gateways that link to the glossary page (and to `/web/...` when a graph profile exists).
- Institutions and other nodes (`Pioneer Class`, `Hoover War Collection`, `Chinatown`, `Angel Island`) are first-class slugs, not only person pages.

### Build order (when building starts)

1. Entity index generated from the ledger, with `webId` joins and a part number for each row. No new prose yet.
2. Tabs on top of existing Web of People sections, plus a Beats panel.
3. Short sourced bios for a first tier only: Hoover, Jordan, Jane and Leland Stanford, Branner, Wilbur, Steinbeck, the Hoover Institution, Stanford University, Chinatown, Angel Island. Stop there until those are good.

---

## 2. Navigable master timeline

**Ask:** the timeline is too long to scroll. Jump by part, volume, or chapter; a sticky side or top index; filter by entity; a way back to the top.

`/timeline` is now a flat ordered list of 139 cards. There is no jump nav, no part or era grouping, and no entity filter. Illustrated cards (in progress on this branch) make the page even longer.

### Proposal

- Sticky index, side on desktop and a compact top bar on small screens: the eight documentary parts, with year spans, plus a "Back to top" control.
- Optional second row of era ticks (1769, 1848, 1869, 1885, 1919, 1945, 1970, 2002, 2025) that jump to the first card at or after that year.
- Filter by entity, reusing the glossary slugs. "Steinbeck" or "Hoover Institution" shows only that node's rows, with a clear "Showing N of 139" state and a reset.
- Deep links: `/timeline#part-5` and `/timeline?entity=john-steinbeck`.
- Do not paginate in a way that hides the continuous scroll; the jump nav is the lever. Keep the illustrated cards as they land.

File this work in the Cardinal site (`site/src/pages/timeline.astro` and the Study Guide timeline). No live deploy until Kyle says so.

---

## 3. Interludes

**Ask:** short on-campus or connected side stories. The founding of a collection can be an excuse to show how powerful the knowledge is. Name Hoover's agents and describe the process. Tell the stories that sit next to the main spine.

Interludes are short, sourced pieces (about 400–800 words) attached to a glossary node and linked from the relevant timeline cards. They are not new acts. Claims below are tagged with what the corpus already has and what still needs a source.

### 3.1 Founding the Hoover collections, and the agents in Europe

**File:** Cardinal (ledger rows 1919-01-01, 1919-04-22, 1919-06-01; Study Guide Act II chapter "Archive as Power").

Already in hand: the 22 April 1919 telegram pledging $50,000; the June 1919 funding of the War Collection, with Ephraim Adams on the ledger row; the 1919 Belgian gift of official documents on the Congo and Ruanda-Urundi, which begins the Africa Collection. Whyte is silent on the 1919 mechanics; those facts stay on the Institution's own pages and should not be cited to Whyte. Linking the Congo gift to the Hoover–Francqui relationship is already marked in the ledger as interpretation, not a documented cause.

Agents and process, from Hoover Institution histories (to be pulled into the research log with page-level cites before prose is drafted): Stanford historian **Ephraim D. Adams** went to Paris in 1919 and collected pamphlets, government documents, newspapers, posters, and other ephemera, using Hoover's relief organisation as infrastructure. Stanford history graduate **Ralph Haswell Lutz** (class of 1906), then with the U.S. military mission in Berlin, was released to help collect and later became library director; he built the German collections and returned to Europe in 1939 to arrange wartime collecting. **Frank A. Golder**, a Russian-archive specialist, collected in Central Europe and, from 1921, inside Soviet Russia while also working for the American Relief Administration; he used contacts including Anatoli Lunacharskii, the commissar for education. **Robert C. Binkley** (Stanford '22) was also detached from army duty to collect. Hoover's line, often quoted in Institution histories, was that there would be "a thousand years to catalogue this library, but only ten years in which to acquire the most valuable of material." **To-verify** that wording against a primary or a paged secondary before it is used as a quotation.

**Research questions:** What, exactly, was in the 1919 Belgian gift? Which crates arrived first, and when? Who, besides the four named men, was on the European network (dealers, ARA staff, diplomats)?

### 3.2 Solzhenitsyn and the Hoover Institution

**File:** Cardinal, under the Hoover Institution node. Not now in the ledger, the rewrite, or the close-reading notes.

Verified, with a correction: Aleksandr Solzhenitsyn was an honorary fellow of the Hoover Institution. He visited in 1975 and 1976; Hoover describes the 1975 visit as his first public appearance in the United States (**to-verify** that "first" against a full biography; he left the USSR in 1974, spent time in Zurich, and later settled in Vermont). Hoover holds *Aleksandr Isaevich Solzhenitsyn speeches and writings, 1975–1982*: a small collection (about two boxes plus audiovisual material), acquired in 1976, including recordings and transcripts, the 1978 Harvard commencement address, and material from the 1975–76 visits. It is not his literary archive, and it is not the manuscript of *The Gulag Archipelago*. That book was written in secret in the Soviet Union and published in 1973, before the Hoover visits. Do not say he was writing *Gulag* at Hoover. Later work such as *The Red Wheel* belongs to the Vermont years, unless a source puts a specific composition task on the campus visits.

Note: Hoover's own timeline page cites a 1970 *Stanford Daily* item and a 1970 *New York Times* piece for the 1975 visit. Those dates precede his expulsion. Use the finding aid and contemporary 1975–76 coverage, not those citations, as the load-bearing sources.

**Research questions:** What did he do on campus in 1975 and 1976? Who invited him, and what did he read or say at Hoover Tower? What, precisely, did he deposit?

### 3.3 The Pioneer Class, and Hoover's relationship with Jordan

**File:** Cardinal, Hoover and Jordan glossary pages; Part 5 / Act II.

"Pioneer Class" is used in more than one way. Hoover entered at the opening in October 1891 and received an A.B. in geology in 1895; Whyte and the close-reading notes treat him as a first-class graduate (Whyte also notes, p. 44, "Strictly speaking, he did not earn his degree," an English condition later cleared). The ledger calls Ray Lyman Wilbur a member of the pioneer Class of 1896. The phrase sometimes means the first entering cohort (1891) and sometimes the first graduating class (1895). **To-verify** Stanford's own usage before the glossary treats it as a single official name.

Jordan was the university's president, not a classmate. They did have a documented relationship, not merely a shared campus:

- As a student, Hoover worked for John Casper Branner, not for Jordan. The close patron in the 1890s is Branner.
- Whyte, p. 123: Jordan "encouraged students to get into 'the game' of useful service, a phrase Hoover adopted as his own."
- Whyte, p. 122: in 1912 Jordan wrote President Taft recommending Hoover for "executive service."
- Whyte, p. 124: after taking a trustee seat, Hoover arranged for Jordan, "the only president in the university's first two decades, to be kicked up to chancellor" and replaced by Branner. Whyte says Hoover wanted the presidency himself.

**Research questions:** What student-era contact is documented beyond the "useful service" line (letters, meetings, student-government business)? How did Jordan and Hoover stand toward each other after 1912?

### 3.4 The case Kyle called "Thaddeus Buckle," with a Stanford doctor

**File:** Cardinal, under Jordan / eugenics (Study Guide already has "Eugenics, Jordan, and the Science of Social Control"). Status: **uncertain — do not draft until Kyle confirms the case.**

Best fit: **_Buck v. Bell_ (1927)**, the Supreme Court decision upholding Virginia's forced-sterilization law (Carrie Buck; Holmes's "three generations of imbeciles are enough"). "Buckle" is a plausible mishearing of "Buck v. Bell" or "the Buck case." No Stanford doctor appears among the witnesses. The expert testimony came from Virginia physicians (Albert Priddy, Joseph DeJarnette) and Eugenics Record Office figures (Harry Laughlin by deposition, Arthur Estabrook). The Stanford tie is intellectual and institutional, not a courtroom appearance: David Starr Jordan (American Breeders Association, Human Betterment Foundation, and related bodies), Lewis Terman (Stanford-Binet; he advocated institutionalization and sterilization of the "unfit"), and Elwood Cubberley. California ran the largest state sterilization program in the country. Ray Lyman Wilbur was a physician and Stanford's president during part of that period; any direct role is **to-verify** and should not be assumed.

Other, weaker candidates, listed so the name is not forced into *Buck v. Bell*: Thaddeus Stevens (already in Episode 2, Pacific Railway Act, not a medical case); Thaddeus Caraway (appears in Whyte on the Teapot Dome fight, 1924, no Stanford doctor). If Kyle meant a different Stanford-doctor case, stop and ask rather than guess further.

### 3.5 Judy Faulkner and Epic Systems

**File:** Optional later Cardinal interlude, or a Silica / platform-power note. Not now in the corpus. Use only after the corrections below.

Kyle recalled that she chose Stanford over Wisconsin for a PhD and grew up in Massachusetts, down the street from where Terman would do semiconductor work. The record does not match that:

- Born 11 August 1943; raised in the Erlton neighborhood of Cherry Hill, New Jersey; Moorestown Friends School, 1961. Not Massachusetts.
- B.S. in mathematics, Dickinson College, 1965. She applied to five Ph.D. programs, including Stanford and the University of Wisconsin–Madison. Both schools, then starting computer-science departments, moved her application into C.S. She **chose Wisconsin**, not Stanford. She earned an M.S. in computer science in 1967 and did not complete a Ph.D. A course with Dr. Warner Slack on computers in medicine set the path to Epic (founded 1979 in Madison, now in Verona, Wisconsin).
- The Terman / semiconductor geography is also off. Frederick Terman's semiconductor story is Stanford and Shockley Semiconductor Laboratory in Mountain View, California (1956), not Massachusetts. Terman did direct Harvard's Radio Research Laboratory during the Second World War (Cambridge, radar, not semiconductors). Shockley's earlier work was at Bell Labs in Murray Hill, New Jersey, tens of miles from Cherry Hill, not "down the street."

The true sliding-door fact is still usable, once corrected: she could have gone to Stanford and did not. Sources: her public biographical record (including the UW–Madison alumni notice and her own later interviews). Do not treat podcast retellings as the final cite when a primary interview exists.

### 3.6 Ellis Island and Angel Island

**File:** Cardinal, with the Exclusion / Chinatown cluster; Sheehan's introduction is already a source for the Pacific side.

The comparison is sound as a framing device, not as a claim that the two stations were legal mirrors. Ellis Island (1892–1954) was the main federal station for European immigration in New York Harbor. Angel Island's Immigration Station (1910–1940) was the main Pacific station and is closely tied to enforcement of Chinese Exclusion; Sheehan opens *The Transpacific Experiment* on that island and calls the station "a relic of the Chinese Exclusion Act of 1882." **To-verify** any implied symmetry (processing times, detention, who was admitted) with standard immigration histories before the interlude states it as fact. Vietnamese and later Asian arrivals mostly postdate Angel Island as a station; do not fold them into the 1910–40 station story without a source.

### 3.7 Chinatown, railroad towns, Wong Kim Ark, Exclusion, and the "century of humiliation"

**File:** Cardinal, Part 3 / the existing rewrite chapter `site/corpus/rewrite/chapters/ep3-04-exclusion.md`. This is the most drafted of the interlude cluster.

Already in the rewrite: the 1882 Act as the first federal statute to bar a specific nationality; Chinatown as both community and legal necessity; *Yick Wo*; *United States v. Wong Kim Ark* (1898), a man born in San Francisco to Chinese parents held to be a citizen by birth. Birthright citizenship as Americans now understand it "runs through that case." The railroad and the laundrymen "shared an amendment." Correct a shorthand in the spoken notes: it is not merely "the California court thing." The case began in the U.S. District Court for the Northern District of California and was decided by the U.S. Supreme Court.

To refine, not to assert yet:

- San Francisco's Chinatown is often called the oldest Chinatown in North America. "The first cultural town" or "the first ethnic enclave in America" is too strong (Irish, German, and other enclaves already existed). **To-verify** the railroad-town thesis (Chinatowns forming along the Central Pacific and later lines) with a historian, not by extension.
- Little Italy, Little Jamaica, and later ethnic towns can be mentioned as descendants of a pattern, not as a single legal story.
- The PRC "century of humiliation" is a political-historical narrative usually running from the Opium Wars to 1949. Exclusion, violence against Chinese communities, and the unequal-treaty era are part of how that narrative is taught and used. It is a question for the interlude — how American institutions and statutes sit inside a story Beijing tells — not a finding that those institutions were "part of a bigger plan than China even dared." Keep the Cardinal method: official narrative, then the human record.

### 3.8 Matt Sheehan, *The Transpacific Experiment*

**File:** Cardinal, China–California thread (Study Guide Act IV already has "The China–California Feedback Loop"). The EPUB is in Cardinal Research Drive (id `1oG--HF6vb5senIf6dSdF2zja0ce0exJI`). Skimmed for this plan, 21 November 2026.

Full title: *The Transpacific Experiment: How China and California Collaborate and Compete for Our Future* (Counterpoint, 2019). Sheehan grew up in Palo Alto, lived in China as a correspondent, and at publication was a nonresident fellow at MacroPolo / the Paulson Institute.

Kyle thought the author was connected to Google through himself or his wife, and that the book watches parents and families buying real estate. The real-estate recollection is right; the Google-family recollection is not, at least not in the book.

- **Real estate, Introduction:** "In my hometown of Palo Alto," "prospective Chinese home buyers were arriving… in droves." They "were boarding luxury buses for mobile real estate tours of the city, purchasing million-dollar homes the way my parents might snap up a nice piece of furniture." Sheehan joined a tour and wrote it up for *The Atlantic*. He also describes multimillion-dollar U.S. homes as "the new Swiss bank account" for wealthy Chinese buyers, on top of an already heated Silicon Valley market. (The comparison to "my parents" is about *his* parents' shopping, not a claim that his parents were the buyers.)
- **Students and families, Chapter 1, "Freshman Orientation":** the boom in Chinese undergraduates, parents paying fees and consultants, and the status of a U.S. degree. That chapter is mostly campus life and admissions, not house-buying.
- **Google:** Chapter 3 follows Li Zhifei and colleagues (including Mike Lei) who left Google in Mountain View and built Mobvoi in China — "a seed spliced with Google genes." That is a subject of the book, not Sheehan's family. Acknowledgments thank his partner, Steph, with no employer named. No passage in the front matter or the chapters skimmed says that Sheehan or his wife worked at Google. Treat the Google-family memory as a mix-up with the Mobvoi thread unless another source appears.

The Introduction also supplies Angel Island, Exclusion, railroad labor, and a family story (Sheehan's Irish San Francisco ancestors, including a priest who keynoted the 1901 California Chinese Exclusion Convention). Use it as a source, with page cites added to the research log when the interlude is written.

### 3.9 San Bruno: railroad stop to YouTube headquarters

**File:** Cardinal, Peninsula / El Camino thread. Episode 1 already lands at SFO on Rancho Buri Buri and notes that the rancho's ground is now San Bruno, Millbrae, South San Francisco, and part of Burlingame. It does not mention YouTube.

The later layer is real and usable: YouTube's headquarters is at 901 Cherry Avenue, San Bruno. The exact move-in year is **to-verify** (commonly given as 2008). The earlier "just a station on the railroad and El Camino" picture is directionally right (Southern Pacific / Peninsula commute, El Camino Real, later a postwar suburb) and needs a short local history cite before it is stated as fact. This is a one-place interlude: the same ground, three regimes (rancho, railroad town, platform headquarters).

---

## 4. Book gaps: the Philippine War, and the line from Polk to Roosevelt

**File:** Cardinal to-get list (`/workspace/cardinal-to-get.md` and the research log). Not in the current buy/borrow list.

Kyle asked for books on the Philippine-American War and on Theodore Roosevelt, Polk, and "the things in between" (Manifest Destiny to overseas empire). These six titles exist and are standard; none are in the Cardinal close-reading queue yet.

1. Brian McAllister Linn, *The Philippine War, 1899–1902* (University Press of Kansas, 2000). The standard military history.
2. Stuart Creighton Miller, *Benevolent Assimilation: The American Conquest of the Philippines, 1899–1903* (Yale University Press, 1982). The conquest and the American self-image.
3. Paul A. Kramer, *The Blood of Government: Race, Empire, the United States, and the Philippines* (University of North Carolina Press, 2006). Race and colonial nation-building.
4. Daniel Immerwahr, *How to Hide an Empire: A History of the Greater United States* (Farrar, Straus and Giroux, 2019). Broader than one war; the Philippines are central.
5. Amy S. Greenberg, *A Wicked War: Polk, Clay, Lincoln, and the 1846 U.S. Invasion of Mexico* (Alfred A. Knopf, 2012). Polk and the Mexican War, the land grab that precedes the railroad story.
6. Evan Thomas, *The War Lovers: Roosevelt, Lodge, Hearst, and the Rush to Empire, 1898* (Little, Brown, 2010). The 1898 turn, with TR and Hearst.

W. Cameron Forbes as Philippine governor is already an open thread in the Ivory/Eli notes (below). If only two are bought first: Linn and Greenberg, then Kramer or Thomas.

---

## 5. Sister book: the East Coast "book of ivory"

**File:** existing planning doc, not a new book folder.

What exists:

- Google Doc, in the Cardinal Research Drive folder: [Ivory: Cardinal Sequel Planning](https://docs.google.com/document/d/18YvO_mOPvNFHo9pdeEcedw5PDfdFwtoNvF1i8YOi4WI/edit) (17 October 2026).
- Decision, 14 October 2026: finish Cardinal first. Yale / East Coast runs as a side lineage *inside* Cardinal for now (Harriman buying Southern Pacific; Delano opium money and FDR; Forbes; MacArthur and Forbes in the Philippines). The doc is a sequel seed.
- Working title of the sequel: **Eli** (alternate: **Bulldog**). "Ivory" is reserved as a part or chapter title, not the book title.
- Premise: an East Coast mirror of the Stanford formula — Elihu Yale's East India Company / Madras fortune (including the slave trade); opium money via Russell & Co. / Forbes / Delano into railroads; Harriman → Yale → Skull and Bones → Brown Brothers Harriman → Prescott Bush; Harvard as comparison, "same documents, same mythos." Same method as Cardinal: official narrative plus the human moments behind the names on signs and jerseys.
- Seed research: [Cardinal: Forbes Network](https://docs.google.com/document/d/1uLr6dL20qg2LgwkscuUQsb4bjQ_fVuEsS-EMfb1e7L4/edit) (21-person table, sources, ratings) and `forbes-network.png` in the same Drive folder.
- Open threads already listed: opium money into Midwest railroads (John Murray Forbes / Burlington) and the Harriman antitrust fight; Delano as partner, not in-law, of the Forbeses, then Warren Delano II → FDR; Skull and Bones cousin link only so far — do not claim opium funded Bones; W. Cameron Forbes after Arthur MacArthur in the Philippines; Handsome Dan / Elis branding versus Cardinal branding.

Nothing under this title lives in the `Artometrics/cardinal` repo. Do not start a new manuscript. When Cardinal scenes touch Harriman, Forbes, Delano, or the Philippines, add a cross-pointer in the research log to the Eli doc.

---

## 6. Mayhem episode ideas

**Where it lives:** a Drive folder, [Mayhem](https://drive.google.com/drive/folders/1Qn_psBURLdSJLqS36YfqSt2_8jQSYbIc), not a repo on this machine. The series bible is [Mayhem - Series Concept](https://docs.google.com/document/d/15jPArFjDgxVBzumsqMdliVxXjauto0tCfZiwAnu_MDc/edit) (a second, earlier copy also exists). Status there: unofficial, unreleased, private creative exercise. Framing: "Black Mirror but if I was Quentin Tarantino"; "Give me an hour."

Episodes already on the list: (1) Patty — Patty Hearst, already scoped, with the note that she does not want it made; (2) Uday; (3) Donner; (4) Beethoven; (5) Napoleon of Crime; (6) Xi Jinping.

Kyle's new candidates, 21 November 2026:

| Idea | Status | Note |
|---|---|---|
| King Leopold II | New, clear | Direct Cardinal overlap (Congo Free State; Francqui; the 1919 Africa Collection). Mayhem can tell the Congo story in an hour; Cardinal should not duplicate it at length, only use the Stanford-facing edge. |
| Patty Hearst | Already Episode 1 | He said "Padme Hearst"; same person. No new slot needed. |
| Carl Panzram | New, clear | The serial killer (often spelled Karl in passing). Not in the current six. |
| The Zebra murders | New, clear enough | San Francisco, 1973–74, the "Death Angels" killings. Local, erasable into a Mayhem hour. |
| "Zebra Kidneys" | **To-confirm** | Best guess: a mishearing of "Zebra killings." No separate "Zebra Kidneys" case was identified. Ask Kyle. |
| "Force factor" | **To-confirm** | Unclear. Possible guesses, none strong: *The Force* (Oakland police); a title still only in his head; a jump in thought from the Faulkner conversation (she learned Fortran at Rochester). Ask rather than invent an episode. |

File the confirmed names onto the Mayhem concept list as candidates, not as locked episodes. Leopold is the one that also feeds Cardinal.

---

## What to build first

When work starts, in this order:

1. **Timeline jump nav and entity filter** — the smallest change that answers "I have to scroll all the way through."
2. **Glossary index plus first-tier entity pages** (filter the ledger; add Beats; write only the first-tier bios).
3. **Three interludes**, in this order:
   1. Founding the Hoover collections (Adams, Lutz, Golder, Binkley; the $50,000 telegram; the Congo / Africa papers). Sourced, on campus, already in the ledger.
   2. The Pioneer Class and the Hoover–Jordan relationship. Character, already in the Whyte notes, with a clear 1912 turn.
   3. Solzhenitsyn at Hoover, told accurately (honorary fellow, 1975–76 visits, small speeches-and-writings collection, not *Gulag*).

Next in line, already half-written: Wong Kim Ark, Exclusion, and Chinatown (refine the existing chapter; add Angel Island from Sheehan). Faulkner only after the corrections above, if at all. "Thaddeus Buckle" only after Kyle names the case.

---

## Open questions for Kyle

1. Confirm whether "Thaddeus Buckle" is *Buck v. Bell*.
2. Confirm "Zebra Kidneys" and "Force factor."
3. Preferred glossary URL: `/study/glossary/[slug]`, as proposed, or a public `/glossary`?
4. For Eli / Ivory: keep the October decision (finish Cardinal first, East Coast as a side lineage), or start a separate outline now?
