#!/usr/bin/env python3
"""Verify every hand-assigned title in data/refs-manual.json against the Wikipedia
API: confirm the page exists, follow redirects to the canonical title, capture the
real URL, and flag disambiguation pages. Writes the verified {title,url,host} into
data/refs-decisions.json (merging with any existing decisions). Prints FAILs
(missing or disambiguation) so they can be corrected — nothing unverified is kept.
"""
import json, os, time, urllib.parse, urllib.request

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
D = os.path.join(PROJ, 'data')
UA = {'User-Agent': 'latticework-sourcing/1.0 (tim@timwheeler.com) educational catalog'}
API = 'https://en.wikipedia.org/w/api.php?'


def get(url, tries=3):
    for i in range(tries):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25))
        except Exception as e:
            if i == tries - 1:
                return {'_error': repr(e)}
            time.sleep(0.6 * (i + 1))


def main():
    manual = json.load(open(os.path.join(D, 'refs-manual.json')))
    items = list(manual.items())
    resolved = {}          # id -> {title,url,host}
    fails = []
    # batch by unique title
    title_to_ids = {}
    for mid, t in items:
        title_to_ids.setdefault(t, []).append(mid)
    titles = list(title_to_ids)
    meta = {}
    for j in range(0, len(titles), 40):
        chunk = titles[j:j + 40]
        url = API + urllib.parse.urlencode({
            'action': 'query', 'titles': '|'.join(chunk), 'redirects': 1,
            'prop': 'info|pageprops', 'inprop': 'url', 'format': 'json'},
            quote_via=urllib.parse.quote)
        d = get(url)
        q = (d or {}).get('query', {})
        norm_map = {n['from']: n['to'] for n in q.get('normalized', [])}
        redir_map = {r['from']: r['to'] for r in q.get('redirects', [])}
        pages = {p['title']: p for p in q.get('pages', {}).values() if 'missing' not in p}
        for t in chunk:
            r = redir_map.get(norm_map.get(t, t), norm_map.get(t, t))
            p = pages.get(r)
            if p:
                meta[t] = {'title': p['title'], 'url': p.get('fullurl', ''),
                           'disambig': 'disambiguation' in (p.get('pageprops') or {})}
        time.sleep(0.05)

    for t, ids in title_to_ids.items():
        m = meta.get(t)
        if not m or not m['url']:
            fails.append((t, 'MISSING', ids)); continue
        if m['disambig']:
            fails.append((m['title'], 'DISAMBIG', ids)); continue
        for mid in ids:
            resolved[mid] = {'title': m['title'], 'url': m['url'], 'host': 'Wikipedia'}

    dec_path = os.path.join(D, 'refs-decisions.json')
    dec = json.load(open(dec_path)) if os.path.exists(dec_path) else {}
    dec.update(resolved)
    json.dump(dec, open(dec_path, 'w'), indent=1, ensure_ascii=False)

    print(f'verified {len(resolved)}/{len(items)} manual refs -> {dec_path}')
    if fails:
        print(f'\n{len(fails)} FAILS (fix in refs-manual.json):')
        for title, why, ids in fails:
            print(f'  [{why}] {title!r}  <- {", ".join(ids)}')


if __name__ == '__main__':
    main()
