#!/usr/bin/env python3
"""Layout + codegen: turn the 752-model catalog + wiring into src/data/models.ts."""
import json, os, re, math, sys
import numpy as np
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(BASE, '..'))
# blurbs + links, generated once by an LLM pass and cached here so the layout is reproducible
WIRING = os.path.join(PROJ, 'data', 'wiring.json')
# worked examples: the teaching half of a plate, kept in their own module so the
# index and lattice don't carry ~300KB of prose they never render
EXAMPLES = os.path.join(PROJ, 'data', 'examples.json')
# copy-as-prompt: one operationalized LLM prompt per plate
PROMPTS = os.path.join(PROJ, 'data', 'prompts.json')
W, H = 3200.0, 2000.0

DISC_CODE = {
    'Mathematics, Probability & Statistics': 'MATHEMATICS',
    'Psychology & Human Nature': 'PSYCHOLOGY',
    'Economics & Microeconomics': 'ECONOMICS',
    'Biology, Evolution & Physiology': 'BIOLOGY',
    'Physics & Chemistry': 'PHYSICS',
    'Engineering & Reliability': 'ENGINEERING',
    'Systems & Complexity': 'SYSTEMS',
    'General Thinking Tools & Epistemology': 'THINKING',
    'Philosophy, Ethics, Literature & Rhetoric': 'PHILOSOPHY',
    'Business Strategy & Moats': 'BUSINESS',
    'Investing & Capital Allocation': 'INVESTING',
    'Accounting & Finance': 'ACCOUNTING',
    'Law & Institutions': 'LAW',
    'History': 'HISTORY',
    'Military & Conflict': 'MILITARY',
    'Art, Narrative & Communication': 'ART',
    'Sociology & Organizations': 'SOCIOLOGY',
    'Computer Science & Information': 'COMPUTING',
}
# cluster anchors on a 3200x2000 canvas, echoing the original arrangement:
# thinking/math/psych/econ across the top band, hard sciences low, humanities right.
ANCHORS = {
    'MATHEMATICS':  (430, 430),
    'THINKING':     (1080, 300),
    'PSYCHOLOGY':   (1850, 380),
    'ECONOMICS':    (2640, 640),
    'BUSINESS':     (2820, 1180),
    'INVESTING':    (2380, 1360),
    'ACCOUNTING':   (2820, 1620),
    'SOCIOLOGY':    (1980, 1020),
    'LAW':          (1500, 1760),
    'HISTORY':      (940, 1780),
    'PHILOSOPHY':   (330, 1180),
    'ART':          (200, 1720),
    'MILITARY':     (2380, 1860),
    'BIOLOGY':      (760, 900),
    'PHYSICS':      (1220, 1180),
    'CHEMISTRY':    (1220, 1180),
    'ENGINEERING':  (1760, 1480),
    'SYSTEMS':      (1600, 820),
    'COMPUTING':    (640, 1450),
}

LEGACY_MAP = {
    'Compound interest / compounding': ('Compound Interest', 'Small gains, relentlessly repeated.', 'Returns earn returns. Time, not timing, does the heavy lifting — in money, knowledge, and reputation alike. The curve looks flat for years, then vertical; most people quit in the flat part.', '«the snowball, mid-hill»', 'growth curve you can bend'),
    'Probabilistic thinking': ('Probabilistic Thinking', 'Update beliefs as evidence arrives.', 'Treat beliefs as bets. New evidence does not flip conclusions; it shifts the odds, one observation at a time.', '«the urn of shifting odds»', 'bayes urn'),
    'Expected value': ('Expected Value', 'Weigh outcomes by their odds.', 'A good decision can lose. Judge choices by the odds-weighted sum of their outcomes, not by the one outcome you happened to get.', '«the weighing of futures»', 'weighted coin bets'),
    'Inversion': ('Inversion', 'Solve backwards from failure.', 'Hard problems yield when reversed. List everything that guarantees failure, then arrange your affairs to avoid it. The mathematician Jacobi solved by inverting; so can you.', '«the map, turned over»', 'goal → anti-goal flip'),
    'Reward and Punishment Superresponse Tendency': ('Incentives', 'Behavior follows reward.', 'Show me the incentive and I will show you the outcome. To predict what people will do, look at what they are rewarded for doing — never at what they say. The lever moves the world, and the sun it lifts toward is whatever is being paid for.', '«the machinery of reward»', 'incentive slider'),
    'Social-Proof Tendency': ('Social Proof', 'We do what the crowd does.', 'In uncertainty we copy the crowd — a fine heuristic that fails precisely when everyone is using it at once.', '«the flock, mid-turn»', 'crowd simulation'),
    'Deprival-Superreaction Tendency': ('Loss Aversion', 'Losses loom larger than gains.', 'Losing $100 stings roughly twice as much as winning $100 pleases. We pay dearly, and irrationally, to avoid that sting.', '«the heavier side of the scale»', 'gamble chooser'),
    'Inconsistency-Avoidance Tendency (commitment and consistency)': ('Commitment Bias', 'We stick to what we’ve declared.', 'A stated position becomes a possession. We defend our declarations long after the evidence has abandoned them.', '«the ratchet of public promises»', 'escalation ladder'),
    'Opportunity cost': ('Opportunity Cost', 'Every yes is a thousand nos.', 'The true cost of anything is the best alternative you gave up to get it. Price tags lie by omission.', '«the road not taken, priced»', 'allocation tray'),
    'Comparative advantage (Ricardo) — and its second-order effects': ('Comparative Advantage', 'Trade what you’re least bad at.', 'Trade thrives on relative, not absolute, skill. Do what you are least bad at; buy the rest from someone else.', '«two islands, one trade»', 'two-island trade'),
    'Supply and demand': ('Supply & Demand', 'Prices are conversations.', 'A price is a negotiation between scarcity and desire. Move either curve and the price must answer.', '«the crossing of curves»', 'market cross'),
    'Evolution by Natural Selection': ('Natural Selection', 'What survives, multiplies.', 'Variation, selection, retention. Markets, ideas, and habits evolve by the same sieve as species.', '«the sieve of generations»', 'mutation runs'),
    'Niches and Specialization': ('Ecological Niche', 'Fit the pocket others ignore.', 'Head-on competition is for losers. Find the pocket where your peculiar advantages fit and others’ do not.', '«the pocket in the reef»', 'niche map'),
    'Critical mass': ('Critical Mass', 'Nothing, nothing, then everything.', 'Systems change state suddenly. Below the threshold, nothing happens; at the threshold, everything does.', '«the last neutron»', 'chain reaction'),
    'Entropy and the second law': ('Entropy', 'Order costs energy.', 'Left alone, things drift toward disorder. Every ordered thing you see is a bill someone is paying.', '«the garden, untended»', 'decay grid'),
    'Margin of Safety': ('Margin of Safety', 'Build for loads that shouldn’t happen.', 'Do not drive a 9,900-pound truck over a bridge rated for 10,000. Leave room to be wrong about the load, the bridge, and yourself.', '«the bridge over-built»', 'bridge stress test'),
    'Redundancy / Backup Systems': ('Redundancy', 'Two is one, one is none.', 'Every critical system needs a backup — and the backup must be independent of the failure it guards against.', '«the second rope»', 'failure cascade'),
    'Feedback Loops': ('Feedback Loops', 'Output becomes input.', 'When output feeds back into input, effects compound or self-correct. Find the loop before it finds you.', '«the loop that feeds itself»', 'thermostat loop'),
}

THINKERS = {
    'munger': 'Charlie Munger', 'buffett': 'Warren Buffett', 'graham': 'Benjamin Graham',
    'franklin': 'Benjamin Franklin', 'darwin': 'Charles Darwin', 'feynman': 'Richard Feynman',
    'einstein': 'Albert Einstein', 'smith': 'Adam Smith', 'ricardo': 'David Ricardo',
    'keynes': 'John Maynard Keynes', 'kahneman': 'Daniel Kahneman', 'tversky': 'Amos Tversky',
    'cialdini': 'Robert Cialdini', 'skinner': 'B.F. Skinner', 'pavlov': 'Ivan Pavlov',
    'bayes': 'Thomas Bayes', 'jacobi': 'Carl Jacobi', 'coase': 'Ronald Coase',
    'shannon': 'Claude Shannon', 'wilson': 'E.O. Wilson', 'roosevelt': 'Theodore Roosevelt',
    'aurelius': 'Marcus Aurelius', 'epictetus': 'Epictetus', 'aristotle': 'Aristotle',
    'cicero': 'Cicero', 'newton': 'Isaac Newton', 'galileo': 'Galileo', 'godel': 'Kurt Godel',
    'porter': 'Michael Porter', 'christensen': 'Clayton Christensen', 'sun-tzu': 'Sun Tzu',
    'clausewitz': 'Carl von Clausewitz', 'boyd': 'John Boyd', 'hardin': 'Garrett Hardin',
    'whitehead': 'Alfred North Whitehead', 'johnson': 'Samuel Johnson', 'taleb': 'Nassim Taleb',
    'simon': 'Herbert Simon', 'von-neumann': 'John von Neumann', 'demosthenes': 'Demosthenes',
    'galbraith': 'J.K. Galbraith', 'gresham': 'Thomas Gresham', 'mandelbrot': 'Benoit Mandelbrot',
}
MIN_BUST = 5  # below this a thinker's medallion isn't worth clicking

PROV_RANK = {'munger-named': 5, 'munger-used': 4, 'munger-adjacent': 3, 'community': 2, 'canon-addition': 1}


def esc(s):
    return (s or '').replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ').strip()


def main():
    catalog = json.load(open(os.path.join(PROJ, 'data/latticework-catalog.json')))['models']
    wiring = {}
    if os.path.exists(WIRING):
        for r in json.load(open(WIRING)):
            if r.get('id'):
                wiring[r['id']] = r
    print(f'catalog={len(catalog)}  wired={len(wiring)}')

    ids = {m['id'] for m in catalog}
    by_id = {m['id']: m for m in catalog}

    # ---- assemble models -------------------------------------------------
    models = []
    for m in catalog:
        w = wiring.get(m['id'], {})
        legacy = LEGACY_MAP.get(m['name'])
        blurb = (w.get('blurb') or '').strip()
        name, long_, cap, demo = m['name'], m['definition'], None, None
        if legacy:
            name, blurb, long_, cap, demo = legacy
        if not blurb:
            d = m['definition']
            blurb = (d.split('.')[0][:57] + '.') if d else name + '.'
        links = [l for l in (w.get('links') or []) if l in ids and l != m['id']]
        models.append({
            'id': m['id'], 'disc': DISC_CODE[m['discipline']], 'name': name,
            'blurb': blurb, 'long': long_, 'cap': cap, 'demo': demo,
            'links': links, 'provenance': m['provenance'],
            'mungerCitation': m['mungerCitation'], 'mungerQuote': m['mungerQuote'],
            'aka': m['aka'], 'thinkers': [t for t in m.get('thinkers', []) if t in THINKERS],
        })

    # ---- symmetrize + guarantee minimum connectivity ---------------------
    idx = {m['id']: i for i, m in enumerate(models)}
    adj = {m['id']: set(m['links']) for m in models}
    for m in models:
        for l in m['links']:
            adj[l].add(m['id'])
    # any orphan gets tied to the strongest-provenance neighbours in its discipline
    for m in models:
        if len(adj[m['id']]) >= 2:
            continue
        peers = sorted(
            (p for p in models if p['disc'] == m['disc'] and p['id'] != m['id']),
            key=lambda p: (-PROV_RANK.get(p['provenance'], 0), p['name']),
        )
        for p in peers[:3]:
            adj[m['id']].add(p['id'])
            adj[p['id']].add(m['id'])
    for m in models:
        m['links'] = sorted(adj[m['id']], key=lambda i: idx[i])

    edges = set()
    for m in models:
        for l in m['links']:
            edges.add(tuple(sorted((m['id'], l))))
    edges = sorted(edges)
    print(f'edges={len(edges)}  avg degree={2*len(edges)/len(models):.1f}')

    # ---- layout: each discipline is its own island ----------------------
    # A single global force layout collapses into a hairball — 3.8k cross-discipline
    # edges overwhelm any anchor gravity. So: lay out each discipline independently
    # using only its INTERNAL edges, then pack the islands. Cross-discipline edges
    # are drawn but exert no force, which is what keeps the clusters legible.
    n = len(models)
    rng = np.random.default_rng(7)
    codes = sorted({m['disc'] for m in models})
    members = {c: [i for i, m in enumerate(models) if m['disc'] == c] for c in codes}
    radius = {c: 34.0 * math.sqrt(len(members[c])) + 46.0 for c in codes}

    def relax(p, ei_local, iters, k, lim, clamp_r=None):
        for it in range(iters):
            t = 1.0 - it / iters
            delta = p[:, None, :] - p[None, :, :]
            d2 = (delta ** 2).sum(-1) + 1e-9
            np.fill_diagonal(d2, np.inf)
            f = ((delta / d2[..., None]) * (k ** 2)).sum(1)
            if len(ei_local):
                d = p[ei_local[:, 0]] - p[ei_local[:, 1]]
                dist = np.sqrt((d ** 2).sum(-1, keepdims=True)) + 1e-9
                att = d * (dist / k) * 0.9
                np.add.at(f, ei_local[:, 0], -att)
                np.add.at(f, ei_local[:, 1], att)
            f += -p * 0.02  # mild pull to the island's own centre
            mag = np.sqrt((f ** 2).sum(-1, keepdims=True)) + 1e-9
            p += f / mag * np.minimum(mag, lim * t + 1.5)
            if clamp_r is not None:
                rad = np.sqrt((p ** 2).sum(-1, keepdims=True)) + 1e-9
                over = (rad > clamp_r).ravel()
                if over.any():
                    p[over] = p[over] / rad[over] * clamp_r
        return p

    # 1. fill each island with a phyllotaxis spiral, most-connected at the centre.
    # A force layout here rings the nodes against the clamp and leaves a hollow
    # middle; a sunflower packing fills the disc evenly and reads as typeset.
    GOLDEN = math.pi * (3.0 - math.sqrt(5.0))
    local = {}
    for c in codes:
        mem = sorted(members[c], key=lambda i: (-len(models[i]['links']), models[i]['name']))
        cnt = len(mem)
        p = np.zeros((cnt, 2))
        for j in range(cnt):
            r = radius[c] * math.sqrt((j + 0.5) / cnt) * 0.92
            a = j * GOLDEN
            p[j] = (r * math.cos(a), r * math.sin(a))
        # tiny deterministic jitter so the spiral never reads as a moiré pattern
        p += rng.normal(0, 3.5, p.shape)
        local[c] = (p, mem)

    # 2. pack the islands: repel to keep discs apart, attract by cross-edge weight
    cross = Counter()
    for a, b in edges:
        ca, cb = models[idx[a]]['disc'], models[idx[b]]['disc']
        if ca != cb:
            cross[tuple(sorted((ca, cb)))] += 1
    ci = {c: i for i, c in enumerate(codes)}
    centers = np.array([ANCHORS[c] for c in codes], dtype=float)
    centers -= centers.mean(0)
    rad = np.array([radius[c] for c in codes])
    pairs = np.array([[ci[a], ci[b]] for (a, b) in cross]).reshape(-1, 2)
    wts = np.array([cross[k_] for k_ in cross], dtype=float)
    wts = (wts / wts.max()) if len(wts) else wts
    for it in range(900):
        f = np.zeros_like(centers)
        delta = centers[:, None, :] - centers[None, :, :]
        d = np.sqrt((delta ** 2).sum(-1))
        np.fill_diagonal(d, 1e9)
        gap = d - (rad[:, None] + rad[None, :] + 58.0)
        push = np.where(gap[..., None] < 0,
                        delta / (d[..., None] + 1e-9) * (-gap[..., None]) * 0.5, 0.0)
        f += np.nan_to_num(push).sum(1)
        if len(pairs):
            dd = centers[pairs[:, 0]] - centers[pairs[:, 1]]
            pull = dd * (wts[:, None] * 0.0016)
            np.add.at(f, pairs[:, 0], -pull)
            np.add.at(f, pairs[:, 1], pull)
        f += -centers * 0.0025
        centers += np.clip(f, -22, 22)

    # 3. place every node = its island centre + its local offset
    pos = np.zeros((n, 2))
    for c in codes:
        p, mem = local[c]
        pos[mem] = p + centers[ci[c]]

    lo, hi = pos.min(0), pos.max(0)
    pad = 100.0
    span = np.maximum(hi - lo, 1.0)
    scale = min((W - 2 * pad) / span[0], (H - 2 * pad) / span[1])
    off = (np.array([W, H]) - span * scale) / 2.0
    pos = (pos - lo) * scale + off
    for i, m in enumerate(models):
        m['lx'], m['ly'] = round(float(pos[i, 0]), 1), round(float(pos[i, 1]), 1)

    # island label sits just above its own disc
    labels = []
    for c in codes:
        pts = pos[members[c]]
        labels.append({'name': c, 'x': round(float(pts[:, 0].mean()), 1),
                       'y': round(float(pts[:, 1].min() - 26), 1), 'n': len(members[c])})

    # ---- emit models.ts --------------------------------------------------
    order = ['MATHEMATICS', 'THINKING', 'PSYCHOLOGY', 'ECONOMICS', 'BUSINESS', 'INVESTING',
             'ACCOUNTING', 'SOCIOLOGY', 'LAW', 'HISTORY', 'PHILOSOPHY', 'ART', 'MILITARY',
             'BIOLOGY', 'PHYSICS', 'ENGINEERING', 'SYSTEMS', 'COMPUTING']
    order = [o for o in order if any(m['disc'] == o for m in models)]
    counts = Counter(m['disc'] for m in models)
    models.sort(key=lambda m: (order.index(m['disc']), -PROV_RANK.get(m['provenance'], 0), m['name']))
    art_ready = next((m['id'] for m in models if m['name'] == 'Incentives'), models[0]['id'])
    full_label = {v: k for k, v in DISC_CODE.items()}

    L = []
    L.append('// GENERATED — see data/README.md. 752 models mined from Munger primary sources')
    L.append('// and five audited compilations, then wired and laid out programmatically.')
    L.append('')
    L.append('export type Discipline =')
    for o in order:
        L.append(f"  | '{o}'")
    L.append('')
    L.append('export type Provenance =')
    for p in ['munger-named', 'munger-used', 'munger-adjacent', 'community', 'canon-addition']:
        L.append(f"  | '{p}'")
    L.append('')
    L.append('export interface Model {')
    L.append('  id: string')
    L.append('  disc: Discipline')
    L.append('  name: string')
    L.append('  blurb: string')
    L.append('  long: string')
    L.append('  /** hand-typeset plates only */')
    L.append('  cap?: string')
    L.append('  /** hand-typeset plates only */')
    L.append('  demo?: string')
    L.append('  links: string[]')
    L.append('  provenance: Provenance')
    L.append('  mungerCitation?: string')
    L.append('  mungerQuote?: string')
    L.append('  aka?: string[]')
    L.append('  /** roster slugs of the thinkers this model belongs to */')
    L.append('  thinkers?: string[]')
    L.append(f'  /** lattice coordinates in a {int(W)} × {int(H)} space */')
    L.append('  lx: number')
    L.append('  ly: number')
    L.append('}')
    L.append('')
    L.append(f'export const LATTICE_W = {int(W)}')
    L.append(f'export const LATTICE_H = {int(H)}')
    L.append('')
    L.append('export const DISCIPLINE_ORDER: Discipline[] = [')
    for o in order:
        L.append(f"  '{o}',")
    L.append(']')
    L.append('')
    L.append('export const DISCIPLINE_LABELS: Record<Discipline, string> = {')
    for o in order:
        L.append(f"  {o}: '{esc(full_label[o])}',")
    L.append('}')
    L.append('')
    L.append('export const PLANNED_COUNTS: Record<Discipline, number> = {')
    for o in order:
        L.append(f'  {o}: {counts[o]},')
    L.append('}')
    L.append('')
    L.append('export const PROVENANCE_LABELS: Record<Provenance, string> = {')
    L.append("  'munger-named': 'Munger named it',")
    L.append("  'munger-used': 'Munger used it',")
    L.append("  'munger-adjacent': 'Attributed to Munger',")
    L.append("  community: 'Community addition',")
    L.append("  'canon-addition': 'Canon addition',")
    L.append('}')
    L.append('')
    L.append('export const CLUSTER_LABELS: { name: Discipline; x: number; y: number; n: number }[] = [')
    for lb in sorted(labels, key=lambda x: order.index(x['name'])):
        L.append(f"  {{ name: '{lb['name']}', x: {lb['x']}, y: {lb['y']}, n: {lb['n']} }},")
    L.append(']')
    L.append('')
    tally = Counter()
    for m in models:
        for t in m['thinkers']:
            tally[t] += 1
    roster = [t for t, n in tally.most_common() if n >= MIN_BUST]
    L.append('export interface Thinker {')
    L.append('  slug: string')
    L.append('  name: string')
    L.append('  count: number')
    L.append('}')
    L.append('')
    L.append('/** Thinkers with enough models to be worth a bust, most-modelled first. */')
    L.append('export const PEOPLE: Thinker[] = [')
    for t in roster:
        L.append(f"  {{ slug: '{t}', name: '{esc(THINKERS[t])}', count: {tally[t]} }},")
    L.append(']')
    L.append('')
    L.append('export const MODELS: Model[] = [')
    for m in models:
        L.append('  {')
        L.append(f"    id: '{m['id']}',")
        L.append(f"    disc: '{m['disc']}',")
        L.append(f"    name: '{esc(m['name'])}',")
        L.append(f"    blurb: '{esc(m['blurb'])}',")
        L.append(f"    long: '{esc(m['long'])}',")
        if m['cap']:
            L.append(f"    cap: '{esc(m['cap'])}',")
        if m['demo']:
            L.append(f"    demo: '{esc(m['demo'])}',")
        L.append(f"    links: [{', '.join(chr(39)+l+chr(39) for l in m['links'])}],")
        L.append(f"    provenance: '{m['provenance']}',")
        if m['mungerCitation']:
            L.append(f"    mungerCitation: '{esc(m['mungerCitation'])}',")
        if m['mungerQuote']:
            L.append(f"    mungerQuote: '{esc(m['mungerQuote'])}',")
        if m['aka']:
            L.append(f"    aka: [{', '.join(chr(39)+esc(a)+chr(39) for a in m['aka'][:6])}],")
        if m['thinkers']:
            L.append(f"    thinkers: [{', '.join(chr(39)+t+chr(39) for t in m['thinkers'])}],")
        L.append(f"    lx: {m['lx']},")
        L.append(f"    ly: {m['ly']},")
        L.append('  },')
    L.append(']')
    L.append('')
    L.append('export const MODELS_BY_ID: Record<string, Model> = Object.fromEntries(')
    L.append('  MODELS.map((m) => [m.id, m]),')
    L.append(')')
    L.append('')
    L.append('/** The one model that has finished plate art so far. */')
    L.append(f"export const ART_READY_ID = '{art_ready}'")
    L.append('')
    L.append('export function capTitle(m: Model): string {')
    L.append("  return (m.cap ?? '').replace(/[«»]/g, '')")
    L.append('}')
    L.append('')
    L.append('export function areLinked(a: Model, b: Model): boolean {')
    L.append('  return a.links.includes(b.id) || b.links.includes(a.id)')
    L.append('}')
    L.append('')
    L.append('// MODELS is grouped by discipline, so prev/next paging needs its own ordering')
    L.append('const BY_NUMBER: Model[] = [...MODELS].sort(')
    L.append('  (a, b) => parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10),')
    L.append(')')
    L.append('')
    L.append('/** The plate `step` places away in plate-number order, wrapping at the ends. */')
    L.append('export function neighborModel(id: string, step: 1 | -1): Model {')
    L.append('  const idx = BY_NUMBER.findIndex((m) => m.id === id)')
    L.append('  return BY_NUMBER[(idx + step + BY_NUMBER.length) % BY_NUMBER.length]')
    L.append('}')
    L.append('')

    out = os.path.join(PROJ, 'src/data/models.ts')
    open(out, 'w').write('\n'.join(L))

    # ---- emit examples module ------------------------------------------
    if os.path.exists(EXAMPLES):
        ex = json.load(open(EXAMPLES))
        live = {m['id'] for m in models}
        E = []
        E.append('// GENERATED — see data/README.md. Worked examples per plate.')
        E.append('')
        E.append('export interface Example {')
        E.append('  /** the setting it happens in, e.g. "The grocery store" */')
        E.append('  context: string')
        E.append('  text: string')
        E.append('}')
        E.append('')
        E.append('export const EXAMPLES: Record<string, Example[]> = {')
        n_ex = 0
        for mid in sorted(k for k in ex if k in live):
            rows = ex[mid]
            if not rows:
                continue
            E.append(f"  {mid}: [")
            for r in rows:
                c, t = esc(r.get('context', '')), esc(r.get('text', ''))
                if not t:
                    continue
                E.append(f"    {{ context: '{c}', text: '{t}' }},")
                n_ex += 1
            E.append('  ],')
        E.append('}')
        E.append('')
        exout = os.path.join(PROJ, 'src/data/examples.ts')
        open(exout, 'w').write('\n'.join(E))
        covered = sum(1 for m in models if ex.get(m['id']))
        print(f'wrote {exout}: {n_ex} examples covering {covered}/{len(models)} models')
        missing = [m['id'] for m in models if not ex.get(m['id'])]
        if missing:
            print(f'  WARNING: {len(missing)} models have no examples: {missing[:8]}')
    else:
        print('no data/examples.json — skipping examples module')

    # ---- emit prompts module -------------------------------------------
    if os.path.exists(PROMPTS):
        pr = json.load(open(PROMPTS))
        live = {m['id'] for m in models}
        P = []
        P.append('// GENERATED — see data/README.md. One copy-paste LLM prompt per plate.')
        P.append('')
        P.append('export interface ModelPrompt {')
        P.append('  /** one line: when to reach for this prompt */')
        P.append('  use: string')
        P.append('  /** the full copy-paste prompt, ending in the situation placeholder */')
        P.append('  body: string')
        P.append('}')
        P.append('')
        P.append('export const PROMPTS: Record<string, ModelPrompt> = {')
        n_p = 0
        for mid in sorted(k for k in pr if k in live):
            r = pr[mid]
            body, use = (r.get('body') or '').strip(), (r.get('use') or '').strip()
            if not body:
                continue
            P.append(f"  {mid}: {{")
            P.append(f"    use: '{esc(use)}',")
            # a prompt is multi-line; emit as a template literal with escapes
            b = body.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
            P.append('    body: `' + b + '`,')
            P.append('  },')
            n_p += 1
        P.append('}')
        P.append('')
        prout = os.path.join(PROJ, 'src/data/prompts.ts')
        open(prout, 'w').write('\n'.join(P))
        print(f'wrote {prout}: {n_p} prompts covering {n_p}/{len(models)} models')
        miss = [m['id'] for m in models if not pr.get(m['id'])]
        if miss:
            print(f'  WARNING: {len(miss)} models have no prompt: {miss[:8]}')
    else:
        print('no data/prompts.json — skipping prompts module')
    print(f'wrote {out}: {len(models)} models, {len(edges)} edges')
    print('blurbs from wiring:', sum(1 for m in models if wiring.get(m['id'], {}).get('blurb')))
    print('legacy plates preserved:', sum(1 for m in models if m['cap']))
    print('discipline counts:', dict(counts))


if __name__ == '__main__':
    main()
