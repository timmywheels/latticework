# Latticework catalog — research data

`latticework-catalog.json` — **963 mental models** across 18 disciplines, each with a definition, a provenance tag, the thinkers it belongs to, and (where one exists) a Munger citation and verbatim quote.

`wiring.json` — per-model `blurb` + `links`, generated once by an LLM pass and cached so the build is reproducible.

`examples.json` — **1,963 worked examples**, 2–3 per model, covering all 963. The teaching half of a plate: a definition says what a model *is*, an example is what makes it stick.

`prompts.json` — **963 copy-as-prompt entries**, one per model. Each is a paste-ready prompt that makes an LLM actually apply that model to the reader's own situation.

`phm-1995-vs-2005.json` — item-by-item mapping between the two incompatible editions of *The Psychology of Human Misjudgment*.

`sources.json` — **37 attributed sources** behind the catalog (primary talks, meeting transcripts, interviews, and the five audited compilations), each with creator, host, type, year, URL, and what it supports. Human-readable form: [`../SOURCES.md`](../SOURCES.md). Every URL was fetched during research and verified against the research record — none reconstructed. The raw fan-out research dumps (~1.9 MB) stayed in `/tmp` as working scratch; this is the curated extract.

## Regenerating the app data

`src/data/models.ts` is **generated** — do not hand-edit it. It is built from the two files above:

```bash
python3 scripts/build-models.py    # needs numpy
```

The script merges `latticework-catalog.json` + `wiring.json`, lays the graph out, and emits `models.ts` (963 models, 3,964 edges) plus the `PEOPLE` bust roster. It also emits `src/data/examples.ts` and `src/data/prompts.ts`. Those are large (~430KB and ~1.7MB), so the plate route is lazy-loaded in `App.tsx` — keeping the index and lattice entry bundle at ~350KB gzipped instead of ~960KB. It is deterministic — same inputs, byte-identical output.

**Anything you want in `models.ts` must live in the generator.** `neighborModel()` was once hand-added to the generated file and would have been destroyed on the next run; it now lives in `build-models.py`. Add exports there, never to the output.

**Layout.** Each discipline is laid out as its own island, filled with a phyllotaxis spiral (most-connected at the centre), and the islands are then packed by cross-discipline edge weight. Cross-discipline edges are drawn but exert **no force** — an earlier global force-directed pass collapsed all 18 disciplines into one hairball, because 2,079 cross-links overwhelm any anchor gravity.

**Hand-typeset plates.** The 18 original models keep their hand-written `name`/`blurb`/`long`/`cap`/`demo` — see `LEGACY_MAP` in the script, which matches them to catalog entries by name. Everything else takes `long` from the catalog `definition` and `blurb` from `wiring.json`; `cap` and `demo` are left undefined and the views treat them as optional. No one guessed at your voice for the other 734.

## The finding that shapes this data

Munger put numbers on the latticework twice, in his own words:

> "80 or 90 important models will carry about 90% of the freight in making you a worldly-wise person."
> — *A Lesson on Elementary, Worldly Wisdom*, USC Business School, 1994

> "You've got to learn 100 models and a few mental tricks and keep doing it all of your life."
> — Stanford Law School, 1996

**He never published the list, and declined to produce one on the record at least twice.** In the 1995 Harvard Q&A he alluded to a private "little list" of mostly microeconomic models and said "I don't have time for that one." At his final post-Wesco meeting (July 1, 2011), asked directly for "a list of the 99 mental models he uses," the notes record: *"He can't do that!"* Tren Griffin says it plainly in *Charlie Munger: The Complete Investor*: "he has never prepared a complete list covering all disciplines."

So every "complete Munger list" in circulation is a community reconstruction — which is why no two agree. This catalog does not pretend otherwise. It records what Munger demonstrably said, tags how strongly each model traces to him, and then extends past him.

## Provenance

The tag is **metadata, not a filter**. Munger is the seed of this catalog, not its boundary.

| tag | meaning | n |
|---|---|---|
| `munger-named` | He explicitly named/labelled it, in a retrievable primary source | 254 |
| `munger-used` | He applied it without naming it as a model — or the only record is an attendee's third-person paraphrase | 111 |
| `munger-adjacent` | A compiler attributes it to him, but evidence is indirect; he never named it | 55 |
| `community` | The latticework genre added it (Farnam Street, Griffin, Bevelin, Hagstrom, Sources of Insight) | 118 |
| `canon-addition` | Added here for discipline completeness, or for a thinker's own body of work; absent from Munger's record and the audited compilations | 425 |

**365 models trace to Munger's own recorded words** (`munger-named` + `munger-used`) — comfortably bracketing the "80–100" he claimed, because he named far more models across his life than he ever used in one breath.

## Thinkers

454 models carry a `thinkers` array of roster slugs (`munger`, `darwin`, `roosevelt`…). A slug means **genuine intellectual association** — the person originated the idea or is inseparably identified with it — not merely that they mentioned it. Munger is deliberately held to his signature models (99) rather than tagged across the catalog he seeded; the provenance field already records his relationship to everything else.

The roster began badly lopsided (Roosevelt 1 model, Marcus Aurelius 0), which makes for busts not worth clicking, so 211 models were added covering what those thinkers are actually known for — The Man in the Arena, premeditatio malorum, the OODA loop, the coastline paradox. 37 thinkers now clear the ≥5 bar and get a medallion.

## Examples

Each plate carries 2–3 (37 models get 3). The bar: an example must show the model **doing work** — changing what someone notices or decides — in a concrete setting, in plain language. Never a definition wearing a costume.

An audit of a 40-model sample scored 6% restatement, 4% jargon, "good" setting variety, verdict ship. It flagged one real recurring flaw — closing-line moralizing, where a good scene bolts the definition on and takes the insight back from the reader. 49 candidates were judged; **24 trimmed, 25 kept** (the regex over-flagged; endings that carry the scene's sting were left alone). Trims were applied under a guard that only permits truncation, never rewriting.

Settings are deliberately domestic as well as professional — a paid-off Civic, two nurses counting narcotics, a chore chart, an HOA board. Abstract models get the most concrete treatment: Gödel's incompleteness is *"The bylaws say the board interprets the bylaws. So who says the board read them right? The bylaws."*

## The prompt library

Every plate has a **COPY AS PROMPT** button, and the prompt is shown rather than hidden — one you can't read before pasting is one you can't trust or edit.

The design bar: a prompt's steps must be what **that** model actually makes you do. A prompt whose steps would suit any model does no work. Base Rates opens by forcing the reference class *before* your specifics; Inversion forbids telling you how to succeed at all. An adversarial audit ran the swap test — "would anyone notice if these steps were moved to a different model?" — and scored 5% interchangeable, 90% executable steps, 100% escape hatch, 100% placeholder.

Two guards are in every prompt:
- **"If this model doesn't fit, say so plainly and stop."** A model forced onto the wrong situation is worse than no model.
- **The UNRESOLVED guard.** The audit's one blocking finding was that many prompts demand facts the reader's paste cannot contain (named precedents, historical magnitudes, returns on capital) — and an LLM told to name three failed competitors *will*, inventing them if needed. So every prompt now ends: *write UNRESOLVED and tell me what to go find. Never invent it.* This was injected deterministically across all 963 rather than trusted to per-model generation.

The **Shelf** copies all saved models as one checklist prompt (`src/lib/promptPack.ts`) — the latticework thesis made operational: run the whole checklist, note which models disagree, and look for the lollapalooza where several point the same way at once.

**Known gap:** the audit flagged M070 (biological scaling) as the one prompt whose steps never do the arithmetic its own premise names, making it liftable onto another model. Worth a fix.

## What was mined

**Primary (Munger's own words):** Poor Charlie's Almanack Talks One and Four–Ten plus Chapter Two (the Investing Principles Checklist and Mungerisms); *A Lesson on Elementary, Worldly Wisdom* (USC, 1994); Talk Three (Stanford Law, 1996); *The Psychology of Human Misjudgment* in both editions; *Academic Economics* (UCSB, 2003); Wesco meeting Q&A 1999–2011; Berkshire meetings 1994–2023; Daily Journal meetings 2013–2023; late interviews (Harvard-Westlake 2010, BBC, Michigan Ross, Caltech 2020, Acquired 2023, CNBC).

**Compilations (audited for provenance, item by item):**

| compilation | items | direct-Munger | community additions |
|---|---|---|---|
| Farnam Street (~100 models) | 101 | 26 | 51 |
| Sources of Insight ("129 list") | 129 | 60 | 23 |
| Tren Griffin (book + 25iq) | 165 | 63 | 55 |
| Peter Bevelin, *Seeking Wisdom* | 49 | 27 | 6 |
| Robert Hagstrom, *The Last Liberal Art* | 54 | 7 | 34 |

Worth knowing: **Farnam Street's list — the one most people mean by "Munger's mental models" — is roughly half community back-fill**, and Parrish never claimed otherwise; he presents it as FS's own curation. Thermodynamics, Hanlon's Razor, and the entire Art and Military buckets are his, not Munger's. Hagstrom's *Latticework* is the main channel through which non-Munger models (equilibrium, complex adaptive systems, pragmatism) entered the genre.

## Method and its limits

1,173 raw instances pooled from 8 primary talks + 4 meeting/interview corpora + 5 compilations, normalized into 18 disciplines, then merged per-discipline into canonical entries (deliberately under-merging: *advantages of scale* and *defects of scale* stay separate, as do *bezzle* / *febezzle* / *foolexures*), then swept for cross-discipline duplicates.

Extractions were adversarially re-checked against the sources of record: **312 items checked, 4 dropped, 26 attribution corrections.** The drops are instructive — one item carried a fabricated "verified against archive.org" provenance claim; another attributed a maxim to William the Silent that every retrievable transcript gives as Ferdinand the Great.

**Known gaps.** Compilation items were audited for provenance but their definitions were not individually re-verified against each compiler's text. Only 57 entries carry a verbatim quote, because most mined records kept citations without quote text — absent quotes were left empty rather than reconstructed. Meeting "transcripts" are frequently attendee paraphrase (Tilson, Boodell, Inoculated Investor), which is why models resting only on those are tagged `munger-used` rather than `munger-named`.

## The 25 tendencies are a 2005 artifact

If you cite "Munger's 25 biases," you are citing the **2005 rewrite**, not the famous 1995 speech. The June 1995 Harvard talk is billed as "24 Standard Causes of Human Misjudgment" and the extant transcription enumerates only **22** — Munger's spoken numbering skips around, and Tilson's brackets correct it ("Seventeen [he means 16]"). The 25 numbered *Tendencies* exist only in Munger's own later rewrite, composed "from memory unassisted by any research."

Between editions: Doubt-Avoidance, Curiosity, Kantian Fairness, Excessive Self-Regard, Overoptimism, and Lollapalooza were **added**; mis-gambling compulsion was **dissolved**; incentives + incentive-caused bias **merged**; liking/disliking **split** in two, as did mental decline into Use-It-or-Lose-It and Senescence. Envy/Jealousy is the only item carried over essentially unchanged. Full mapping in `phm-1995-vs-2005.json`.
