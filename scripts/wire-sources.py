#!/usr/bin/env python3
"""Wire each catalog model to the source IDs it traces to, from mungerCitation + listedBy.
Idempotent: safe to re-run. Expands data/sources.json with the Almanack talks on first run."""
import json, os, re

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(PROJ, 'data', 'sources.json')
CAT = os.path.join(PROJ, 'data', 'latticework-catalog.json')

doc = json.load(open(SRC))
srcs = doc['sources']
have = {s['id'] for s in srcs}

# ---- expand to cover every cited venue (once) ------------------------------
KAUF = 'Poor Charlie’s Almanack (Stripe Press digital edition), edited by Peter D. Kaufman.'
EXTRA = [
 ('S30', 'Poor Charlie’s Almanack, Talk Four: Practical Thought About Practical Thought?', '1996',
  'https://www.stripe.press/poor-charlies-almanack/talk-four', 'primary-talk',
  'The turning-$2M-into-$2T Coca-Cola thought experiment; Pavlovian/operant conditioning, autocatalysis, social proof, the five helpful notions.'),
 ('S31', 'Poor Charlie’s Almanack, Talk Five: The Need for More Multidisciplinary Skills from Professionals', '1998',
  'https://www.stripe.press/poor-charlies-almanack/talk-five', 'primary-talk',
  'Harvard Law School 50th reunion; multidisciplinary worldly wisdom, man-with-a-hammer, the hard-science ethos, tragedy of the commons, invisible hand/foot.'),
 ('S32', 'Poor Charlie’s Almanack, Talk Six: Investment Practices of Leading Charitable Foundations', '1998',
  'https://www.stripe.press/poor-charlies-almanack/talk-six', 'primary-talk',
  'Croupier’s take / frictional costs, overconfidence, indexing, buried covariance, focus investing, self-insurance.'),
 ('S33', 'Poor Charlie’s Almanack, Talk Seven: Breakfast Meeting of the Philanthropy Roundtable', '2000',
  'https://www.stripe.press/poor-charlies-almanack/talk-seven', 'primary-talk',
  'Galbraith’s bezzle and Munger’s febezzle/foolexures extension, wealth effect, Keynesian multiplier, crowd folly.'),
 ('S34', 'Poor Charlie’s Almanack, Talk Eight: The Great Financial Scandal of 2003', '2000',
  'https://www.stripe.press/poor-charlies-almanack/talk-eight', 'primary-talk',
  'Fictional Quant Tech accounting parable; functional-equivalence test, dollop-by-dollop gradualism, Ponzi/chain-letter mechanics, reputational rub-off.'),
 ('S35', 'Poor Charlie’s Almanack, Talk Nine: Academic Economics — Strengths and Faults', '2003',
  'https://www.stripe.press/poor-charlies-almanack/talk-nine', 'primary-talk',
  'UCSB Herb Kay Memorial Lecture; the nine faults — fatal unconnectedness, physics envy, febezzlement, comparative advantage & second-order effects, Gresham’s law extension, opportunity cost.'),
 ('S36', 'Poor Charlie’s Almanack, Talk Ten: USC Gould School of Law Commencement', '2007',
  'https://www.stripe.press/poor-charlies-almanack/talk-ten', 'primary-talk',
  'Learning machine, inversion, the iron prescription, seamless web of deserved trust, assiduity, Planck vs chauffeur knowledge.'),
 ('S37', 'Poor Charlie’s Almanack, Chapter Two: The Munger Approach to Life, Learning, and Decision Making', '2005',
  '', 'primary-writing',
  'The Munger Approach plus the Investing Principles Checklist and Mungerisms; two-track analysis, circle of competence, moats, margin of safety, opportunity cost, sit-on-your-ass investing.'),
]
for sid, title, year, url, typ, sup in EXTRA:
    if sid not in have:
        srcs.append({'id': sid, 'title': title, 'creator': 'Charlie Munger', 'host': 'Stripe Press',
                     'type': typ, 'year': year, 'url': url, 'supports': sup, 'attributionNote': KAUF})

# ---- mapping rules ---------------------------------------------------------
COMP = [(r'griffin', 'S18'), (r'farnam|\bfs\b', 'S20'),
        (r'sources of insight|soi', 'S19'), (r'hagstrom', 'S16'), (r'bevelin', 'S17')]
SLUG = [(r'talk1-|harvard-1986', ['S01']), (r'talk4|practical-thought', ['S30']),
        (r'talk5', ['S31']), (r'talk6-7|foundations', ['S32', 'S33']),
        (r'talk8|scandal', ['S34']), (r'talk9|academic-economics|econ-2003', ['S35']),
        (r'talk10|usc-gould|usc-2007', ['S36']), (r'almanack-ch2', ['S37']),
        (r'wesco', ['S06']), (r'berkshire', ['S08']), (r'daily-journal', ['S10'])]
# ordered venue rules; each returns a list (PHM can be both editions)
def venue_ids(low):
    out = []
    if re.search(r'psychology of human misjudgment|25 tendenc|24 standard|reward and punishment superresponse', low):
        if re.search(r'1995|24 standard|harvard 1995', low): out.append('S03')
        if re.search(r'2005|almanack|tendency|25 tendenc', low) or 'S03' not in out: out.append('S07')
        return out
    for pat, i in [
        (r'practical thought about practical thought', 'S30'),
        (r'talk five|multidisciplinary skills|harvard law', 'S31'),
        (r'investment practices of leading charitable|talk six', 'S32'),
        (r'philanthropy roundtable|talk seven', 'S33'),
        (r'great financial scandal|talk eight|quant tech', 'S34'),
        (r'academic economics|herb kay|talk nine|ucsb', 'S35'),
        (r'usc gould|usc law commencement|talk ten|gould school', 'S36'),
        (r'talk one|harvard school commencement', 'S01'),
        (r'worldly wisdom revisited|stanford law|talk three', 'S04'),
        (r"lesson on elementary|elementary worldly wisdom|usc business school|usc 'elementary", 'S02'),
        (r'mungerism|munger approach|poor charlie', 'S37'),
        (r'harvard-westlake', 'S11'), (r'caltech', 'S13'),
        (r'university of michigan|michigan|ross', 'S12'), (r'acquired', 'S14'),
        (r'life of wit and wisdom|cnbc', 'S15'),
        (r'daily journal.*2013', 'S09'), (r'daily journal', 'S10'),
        (r'wesco', 'S06'), (r'berkshire hathaway annual', 'S08'),
    ]:
        if re.search(pat, low):
            return [i]
    return out

url_ids = {s['url'].rstrip('/'): s['id'] for s in srcs if s['url']}

def resolve(m):
    ids, cite = [], (m.get('mungerCitation') or '')
    mu = re.search(r'https?://\S+', cite)
    if mu:
        u = mu.group(0).rstrip('.,;)];/')
        if u in url_ids: ids.append(url_ids[u])
    ids += venue_ids(cite.lower())
    for lb in (m.get('listedBy') or []):
        l = lb.lower()
        for pat, i in COMP:
            if re.search(pat, l): ids.append(i)
        for pat, arr in SLUG:
            if re.search(pat, l): ids += arr
    seen, out = set(), []
    for i in ids:
        if i and i not in seen:
            seen.add(i); out.append(i)
    return out

cat = json.load(open(CAT))
PRIMARY_TYPES = {'primary-talk', 'primary-writing', 'primary-meeting-transcript', 'primary-interview'}
prim_ids = {s['id'] for s in srcs if s['type'] in PRIMARY_TYPES}
wired = 0
for m in cat['models']:
    m['sources'] = resolve(m)
    if m['sources']: wired += 1

json.dump(doc, open(SRC, 'w'), indent=1, ensure_ascii=False)
json.dump(cat, open(CAT, 'w'), indent=1, ensure_ascii=False)

# sanity
bad = sum(1 for m in cat['models'] if m['provenance'] == 'canon-addition'
          and any(s in prim_ids for s in m['sources']))
print(f'sources: {len(srcs)}  |  models wired: {wired}/963  |  canon-additions w/ primary source: {bad}')
from collections import Counter
print('per-model:', dict(sorted(Counter(len(m['sources']) for m in cat['models']).items())))
