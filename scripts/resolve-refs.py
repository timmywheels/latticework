#!/usr/bin/env python3
"""Resolve a verified reference URL for every model, against the Wikipedia API.

Two passes:
  1. opensearch per model name (+ aka) -> up to 5 candidate article titles.
  2. batch-fetch each candidate's intro extract + disambiguation flag + canonical
     URL, then score candidate vs the model (title match, definition overlap,
     discipline sanity). Nothing is fabricated: only titles Wikipedia returns.

Output: scratchpad/refs-resolved.json with, per model, the chosen candidate and a
confidence tier (HIGH auto-accept / MED / LOW / NONE) plus all candidates so the
ambiguous ones can be judged. This script decides nothing final for MED/LOW — it
just measures and stages the work.
"""
import json, os, re, sys, time, urllib.parse, urllib.request

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/refs-resolved.json'
UA = {'User-Agent': 'latticework-sourcing/1.0 (tim@timwheeler.com) educational catalog'}
API = 'https://en.wikipedia.org/w/api.php?'

STOP = set('the a an of and or vs versus to in on for with by as is are be its it your you '
           'that this these those effect law model theory principle bias fallacy'.split())


def norm(s):
    s = re.sub(r'\([^)]*\)', ' ', s or '')          # drop parentheticals
    s = re.sub(r'[^a-z0-9 ]', ' ', s.lower())
    return re.sub(r'\s+', ' ', s).strip()


def stem(w):
    for suf in ('ies', 'es', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)] + ('y' if suf == 'ies' else '')
    return w


def toks(s):
    return {stem(w) for w in norm(s).split() if w not in STOP and len(w) > 2}


def search_terms(m):
    """Clean, de-parenthesized query variants for a model: the whole cleaned name,
    each side of a ' / ' or ' vs ' split, and the first alias."""
    name = re.sub(r'\([^)]*\)', ' ', m['name']).strip()
    parts = re.split(r'\s*(?:/|\bvs\.?\b|\bversus\b)\s*', name)
    terms = [name] + [p.strip() for p in parts if p.strip() and p.strip() != name]
    for a in (m.get('aka') or [])[:2]:
        a = re.sub(r'\([^)]*\)', ' ', a).strip()
        if a:
            terms.append(a)
    seen, out = set(), []
    for t in terms:
        if t.lower() not in seen and len(t) > 2:
            seen.add(t.lower()); out.append(t)
    return out[:4]


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return json.load(urllib.request.urlopen(req, timeout=25))
        except Exception as e:
            if i == tries - 1:
                return {'_error': repr(e)}
            time.sleep(0.6 * (i + 1))


def opensearch(q):
    url = API + urllib.parse.urlencode({'action': 'opensearch', 'search': q,
                                        'limit': 5, 'namespace': 0, 'format': 'json'})
    d = get(url)
    if isinstance(d, list) and len(d) >= 4:
        return list(zip(d[1], d[3]))   # [(title, url), ...]
    return []


def fulltext(q):
    """MediaWiki full-text search — finds articles by content, so composite/stylized
    names ('Advantages of Scale') reach the real article ('Economies of scale')."""
    url = API + urllib.parse.urlencode({'action': 'query', 'list': 'search',
                                        'srsearch': q, 'srlimit': 4, 'srnamespace': 0,
                                        'format': 'json'})
    d = get(url)
    hits = (d or {}).get('query', {}).get('search', [])
    return [(h['title'], '') for h in hits]


def main():
    cat = json.load(open(os.path.join(PROJ, 'data', 'latticework-catalog.json')))
    models = cat['models']

    # pass 1: candidates
    cand_titles = {}   # model id -> [(title,url), ...]
    all_titles = set()
    for i, m in enumerate(models):
        seen, cands = set(), []
        terms = search_terms(m)
        for q in terms:
            for t, u in opensearch(q):
                if t not in seen:
                    seen.add(t); cands.append((t, u))
        # full-text only on the primary cleaned term — catches composite names
        for t, u in fulltext(terms[0]):
            if t not in seen:
                seen.add(t); cands.append((t, u))
        cand_titles[m['id']] = cands[:8]
        all_titles.update(t for t, _ in cands[:8])
        if (i + 1) % 50 == 0:
            print(f'  opensearch {i+1}/{len(models)}  ({len(all_titles)} uniq titles)', flush=True)
        time.sleep(0.03)

    # pass 2: batch-fetch extract + disambig flag + canonical url for all titles
    meta = {}
    titles = list(all_titles)
    for j in range(0, len(titles), 40):
        chunk = titles[j:j + 40]
        url = API + urllib.parse.urlencode({
            'action': 'query', 'titles': '|'.join(chunk), 'redirects': 1,
            'prop': 'extracts|pageprops|info', 'inprop': 'url',
            'exintro': 1, 'explaintext': 1, 'format': 'json'}, quote_via=urllib.parse.quote)
        d = get(url)
        q = (d or {}).get('query', {})
        norm_map = {n['from']: n['to'] for n in q.get('normalized', [])}
        redir_map = {r['from']: r['to'] for r in q.get('redirects', [])}
        pages = q.get('pages', {})
        by_title = {p['title']: p for p in pages.values() if 'missing' not in p}
        for t in chunk:
            r = redir_map.get(norm_map.get(t, t), norm_map.get(t, t))
            p = by_title.get(r)
            if p:
                meta[t] = {
                    'title': p['title'],
                    'url': p.get('fullurl', ''),
                    'extract': (p.get('extract') or '')[:600],
                    'disambig': 'disambiguation' in (p.get('pageprops') or {}),
                }
        print(f'  meta {min(j+40,len(titles))}/{len(titles)}', flush=True)
        time.sleep(0.05)

    # score
    out = []
    tiers = {'HIGH': 0, 'MED': 0, 'LOW': 0, 'NONE': 0}
    for m in models:
        name_tok = toks(m['name'])
        aka_toks = [toks(a) for a in (m.get('aka') or []) if toks(a)]
        deftok = name_tok | toks(m.get('definition', ''))
        scored = []
        for t, _ in cand_titles[m['id']]:
            mt = meta.get(t)
            if not mt:
                continue
            tt = toks(mt['title'])
            jac = len(tt & name_tok) / max(1, len(tt | name_tok))
            ext_ov = len(deftok & toks(mt['extract'])) / max(1, len(deftok))
            # exact = same concept: identical token set, an alias match, or one title
            # fully containing/contained by the name with strong overlap
            exact = bool(tt) and (
                tt == name_tok
                or any(tt == at for at in aka_toks)
                or (tt <= name_tok and jac >= 0.5)
                or (name_tok <= tt and jac >= 0.5)
            )
            scored.append({'title': mt['title'], 'url': mt['url'],
                           'disambig': mt['disambig'], 'exact': exact,
                           'jac': round(jac, 2), 'ext_ov': round(ext_ov, 2),
                           'extract': mt['extract'][:180]})
        scored.sort(key=lambda c: (c['exact'] and not c['disambig'],
                                   not c['disambig'], c['jac'] + c['ext_ov']), reverse=True)
        best = scored[0] if scored else None
        if best and best['exact'] and not best['disambig']:
            tier = 'HIGH'
        elif best and not best['disambig'] and (best['jac'] >= 0.34 or best['ext_ov'] >= 0.3):
            tier = 'MED'
        elif best and not best['disambig'] and (best['jac'] > 0 or best['ext_ov'] > 0.12):
            tier = 'LOW'
        else:
            tier = 'NONE'
        tiers[tier] += 1
        out.append({'id': m['id'], 'name': m['name'], 'disc': m['discipline'],
                    'aka': m.get('aka') or [], 'definition': (m.get('definition') or '')[:220],
                    'tier': tier, 'best': best, 'candidates': scored[:5]})

    json.dump({'tiers': tiers, 'models': out}, open(OUT, 'w'), indent=1, ensure_ascii=False)
    print('\nTIERS:', tiers)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
