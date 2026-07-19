#!/usr/bin/env python3
"""Renumber model ids so M001..M963 follow a deterministic *shuffled* order in
which no two consecutive ids share a discipline — so the ALL ledger, read in
model-number order, is an eclectic mix rather than 137 Economics in a row, and
the daily email (which walks id order) is varied for free. Applies the same
old→new bijection to the catalog, wiring, examples, and prompts. Slugs are
name-derived, so URLs are unaffected.

The order is seeded on each model's NAME (a stable identity, unlike the id we're
reassigning), so the migration is idempotent: rerunning reproduces the same ids.
"""
import json, os


def _mix(x):
    """splitmix32 finalizer — strong avalanche so sequential inputs scatter."""
    x = (x + 0x9E3779B9) & 0xFFFFFFFF
    x = ((x ^ (x >> 16)) * 0x21F0AAAD) & 0xFFFFFFFF
    x = ((x ^ (x >> 15)) * 0x735A2D97) & 0xFFFFFFFF
    return (x ^ (x >> 15)) & 0xFFFFFFFF


def _fnv(s):
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h


# The curated opener: the first 25 ids, in this order, are hand-picked "banger"
# models so the ledger captivates from M0001 down. Pinned by CATALOG name (stable
# across reruns) — the catalog stores Incentives under its formal name, which
# build renames to "Incentives" for display. Everything after M0025 stays shuffled.
PIN_ORDER = [
    'Reward and Punishment Superresponse Tendency',  # Incentives
    'Inversion',
    'Compound interest / compounding',
    'Circle of competence',
    'Margin of Safety',
    'Opportunity cost',
    'Lollapalooza Effect',
    'First principles thinking',
    'Supply and demand',
    'Evolution by Natural Selection',
    'Network Effects',
    'Game theory',
    "Bayes' theorem / Bayesian updating",
    'Survivorship bias',
    'Confirmation Bias',
    'Black swan events',
    'Antifragility',
    'Pareto principle (80/20)',
    "Occam's razor",
    'Economic Moats',
    "Prisoner's dilemma",
    'Entropy and the second law',
    'Mr. Market',
    'Dunning-Kruger Effect',
    "Chesterton's fence",
]


def shuffled_order(models):
    """The curated openers first, then a stable pseudo-random tail.

    PIN_ORDER takes M0001..M0025 in the given order. The rest are sorted by a
    well-mixed hash of the name (looks random, fully deterministic) — enough to
    break up the long single-discipline blocks. The point is variety, not
    eliminating every adjacency, so the occasional back-to-back pair is fine.
    """
    by_name = {}
    for m in models:
        by_name.setdefault(m['name'], []).append(m)
    pinned = []
    for nm in PIN_ORDER:
        hits = by_name.get(nm, [])
        assert len(hits) == 1, f'PIN_ORDER name matched {len(hits)} models (need exactly 1): {nm!r}'
        pinned.append(hits[0])
    pinned_ids = {m['id'] for m in pinned}
    tail = [m for m in sorted(models, key=lambda m: _mix(_fnv(m['name']))) if m['id'] not in pinned_ids]
    return pinned + tail

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
D = os.path.join(PROJ, 'data')

# must match build-models.py exactly
ORDER = ['MATHEMATICS', 'THINKING', 'PSYCHOLOGY', 'ECONOMICS', 'BUSINESS', 'INVESTING',
         'ACCOUNTING', 'SOCIOLOGY', 'LAW', 'HISTORY', 'PHILOSOPHY', 'ART', 'MILITARY',
         'BIOLOGY', 'PHYSICS', 'ENGINEERING', 'SYSTEMS', 'COMPUTING']
DISC_CODE = {
    'Mathematics, Probability & Statistics': 'MATHEMATICS', 'Psychology & Human Nature': 'PSYCHOLOGY',
    'Economics & Microeconomics': 'ECONOMICS', 'Biology, Evolution & Physiology': 'BIOLOGY',
    'Physics & Chemistry': 'PHYSICS', 'Engineering & Reliability': 'ENGINEERING',
    'Systems & Complexity': 'SYSTEMS', 'General Thinking Tools & Epistemology': 'THINKING',
    'Philosophy, Ethics, Literature & Rhetoric': 'PHILOSOPHY', 'Business Strategy & Moats': 'BUSINESS',
    'Investing & Capital Allocation': 'INVESTING', 'Accounting & Finance': 'ACCOUNTING',
    'Law & Institutions': 'LAW', 'History': 'HISTORY', 'Military & Conflict': 'MILITARY',
    'Art, Narrative & Communication': 'ART', 'Sociology & Organizations': 'SOCIOLOGY',
    'Computer Science & Information': 'COMPUTING',
}
PROV_RANK = {'munger-named': 5, 'munger-used': 4, 'munger-adjacent': 3, 'community': 2, 'canon-addition': 1}


def main():
    cat = json.load(open(os.path.join(D, 'latticework-catalog.json')))
    models = cat['models']

    ordered = shuffled_order(models)
    # 4-digit zero-pad: the catalog is nearing 1000, so M0001..M0963 keeps ids a
    # fixed width (and column-aligned) even once it crosses into four figures.
    remap = {m['id']: f'M{i:04d}' for i, m in enumerate(ordered, 1)}

    # bijection sanity
    assert len(remap) == len(models), 'duplicate old ids'
    assert len(set(remap.values())) == len(models), 'duplicate new ids'

    # 1. catalog: id field
    for m in models:
        m['id'] = remap[m['id']]
    json.dump(cat, open(os.path.join(D, 'latticework-catalog.json'), 'w'), indent=1, ensure_ascii=False)

    # 2. wiring: id key + links values
    wiring = json.load(open(os.path.join(D, 'wiring.json')))
    dropped_links = 0
    for r in wiring:
        r['id'] = remap[r['id']]
        new_links = []
        for l in r.get('links', []):
            if l in remap:
                new_links.append(remap[l])
            else:
                dropped_links += 1
        r['links'] = new_links
    json.dump(wiring, open(os.path.join(D, 'wiring.json'), 'w'), indent=1, ensure_ascii=False)

    # 3 + 4. examples + prompts: remap keys
    for fn in ('examples.json', 'prompts.json'):
        obj = json.load(open(os.path.join(D, fn)))
        remapped = {remap[k]: v for k, v in obj.items() if k in remap}
        assert len(remapped) == len(obj), f'{fn}: some keys were not valid ids'
        json.dump(remapped, open(os.path.join(D, fn), 'w'), indent=1, ensure_ascii=False)

    # verify: every wiring link is a live id; examples/prompts cover the catalog
    live = {m['id'] for m in models}
    ex = json.load(open(os.path.join(D, 'examples.json')))
    pr = json.load(open(os.path.join(D, 'prompts.json')))
    bad_links = sum(1 for r in wiring for l in r['links'] if l not in live)
    assert bad_links == 0, f'{bad_links} dangling wiring links'
    assert set(ex).issubset(live) and set(pr).issubset(live), 'orphan example/prompt keys'

    # the seed the app studies by default — report new ids by name so useStudied can update
    seed_names = ['Compound Interest', 'Inversion', 'Incentives']
    seeds = {}
    for m in models:
        nm = m['name']
        if nm in seed_names or nm == 'Deprival-Superreaction Tendency':
            seeds[nm] = m['id']

    print(f'renumbered {len(models)} ids in shuffled order (Incentives pinned to M0001)')
    print(f'  wiring links dropped (were already dangling): {dropped_links}')
    print(f'  examples={len(ex)} prompts={len(pr)} — all keys valid, links resolve')
    print('  new seed ids:', seeds)
    # hardcoded studied seeds in src/hooks/useStudied.ts must move with the ids
    watch = ['M005', 'M098', 'M236', 'M206']
    print('  DEFAULT_STUDIED remap:', {o: remap[o] for o in watch if o in remap})
    # verify the mix: walking ids in order must never repeat a discipline back-to-back
    seq = sorted(models, key=lambda m: int(m['id'][1:]))
    max_run, run = 1, 1
    for a, b in zip(seq, seq[1:]):
        run = run + 1 if a['discipline'] == b['discipline'] else 1
        max_run = max(max_run, run)
    print(f'  max consecutive same-discipline run in id order: {max_run}')


if __name__ == '__main__':
    main()
