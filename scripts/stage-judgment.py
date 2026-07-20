#!/usr/bin/env python3
"""Two modes:

  stage-judgment.py digest [TIER...]
      Print non-HIGH models with numbered candidates so they can be judged by eye.
      Optional TIER filter (MED LOW NONE). Grouped, compact.

  stage-judgment.py apply picks.json
      picks.json = { "M0245": 2, "M0091": "none", "M0050": {"title","url","host"} }
      An int selects that candidate index from refs-resolved.json; "none" leaves the
      model ref-less; an object supplies a hand-found reference. Merges into
      data/refs-decisions.json (preserving prior decisions).
"""
import json, os, sys

PROJ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEC = os.path.join(PROJ, 'data', 'refs-decisions.json')
RES = '/tmp/refs-resolved.json'


def digest(tiers):
    ms = json.load(open(RES))['models']
    want = set(t.upper() for t in tiers) if tiers else {'MED', 'LOW', 'NONE'}
    sel = [m for m in ms if m['tier'] in want]
    for m in sel:
        print(f"\n{m['id']} [{m['tier']}] {m['name']}  ·  {m['disc']}")
        print(f"    def: {m['definition'][:150]}")
        if not m['candidates']:
            print('    (no candidates)')
        for i, c in enumerate(m['candidates']):
            dis = ' DISAMBIG' if c['disambig'] else ''
            print(f"    [{i}] {c['title']}  (jac={c['jac']} ov={c['ext_ov']}{dis})")
            print(f"        {c['extract'][:120]}")
    print(f"\n{len(sel)} models in {sorted(want)}")


def apply(picks_path):
    picks = json.load(open(picks_path))
    by_id = {m['id']: m for m in json.load(open(RES))['models']}
    dec = json.load(open(DEC)) if os.path.exists(DEC) else {}
    for mid, pick in picks.items():
        if pick == 'none':
            dec[mid] = None
        elif isinstance(pick, int):
            c = by_id[mid]['candidates'][pick]
            dec[mid] = {'title': c['title'], 'url': c['url']}
        elif isinstance(pick, dict):
            dec[mid] = pick
    json.dump(dec, open(DEC, 'w'), indent=1, ensure_ascii=False)
    print(f'decisions now: {len(dec)} (wrote {DEC})')


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'apply':
        apply(sys.argv[2])
    else:
        digest(sys.argv[2:])
