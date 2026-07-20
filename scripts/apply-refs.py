#!/usr/bin/env python3
"""Merge resolved + hand-judged reference links onto every catalog model.

Inputs:
  /tmp/refs-resolved.json     — resolver output (HIGH tier auto-accepted)
  data/refs-decisions.json    — { id: {title,url,host} | null }  overrides/judgments
                                 for MED/LOW/NONE (and any HIGH we want to correct).
                                 null means "intentionally left without a Wikipedia ref"
                                 (should be rare; every model ought to get one).

Writes `ref` onto each model in data/latticework-catalog.json and reports coverage.
Only titles/URLs that came from the Wikipedia API (resolver) or an explicit decision
are used — nothing is guessed here.
"""
import json, os

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
D = os.path.join(PROJ, 'data')


def host_for(url):
    if 'plato.stanford.edu' in url:
        return 'Stanford Encyclopedia of Philosophy'
    if 'investopedia.com' in url:
        return 'Investopedia'
    if 'wikipedia.org' in url:
        return 'Wikipedia'
    return url.split('/')[2].replace('www.', '') if '//' in url else 'Reference'


def main():
    resolved = json.load(open('/tmp/refs-resolved.json'))['models']
    by_id = {r['id']: r for r in resolved}
    dec_path = os.path.join(D, 'refs-decisions.json')
    decisions = json.load(open(dec_path)) if os.path.exists(dec_path) else {}

    cat = json.load(open(os.path.join(D, 'latticework-catalog.json')))
    covered = missing = 0
    missing_ids = []
    for m in cat['models']:
        ref = None
        if m['id'] in decisions:                       # explicit judgment wins
            d = decisions[m['id']]
            if d:
                ref = {'title': d['title'], 'url': d['url'],
                       'host': d.get('host') or host_for(d['url'])}
        else:                                          # else auto-accept HIGH tier
            r = by_id.get(m['id'])
            b = r['best'] if r else None
            # HIGH always; plus "confident MED" (exact, clean, non-disambig, well
            # supported) for models that already carry a Munger source as backstop —
            # e.g. 'Three-body problem', which only missed HIGH on the more-general rule
            confident_med = (
                b and r['tier'] == 'MED' and b.get('exact') and not b.get('disambig')
                and not b.get('media') and (b.get('ext_ov', 0) > 0 or b.get('jac', 0) >= 0.6)
                and m.get('sources')
            )
            if b and (r['tier'] == 'HIGH' or confident_med):
                ref = {'title': b['title'], 'url': b['url'], 'host': host_for(b['url'])}
        if ref:
            m['ref'] = ref
            covered += 1
        else:
            m.pop('ref', None)
            missing += 1
            missing_ids.append(m['id'])

    json.dump(cat, open(os.path.join(D, 'latticework-catalog.json'), 'w'),
              indent=1, ensure_ascii=False)
    print(f'refs applied: {covered}/{len(cat["models"])} covered, {missing} missing')
    if missing_ids:
        print('missing ids:', ' '.join(missing_ids[:60]), '...' if missing > 60 else '')


if __name__ == '__main__':
    main()
