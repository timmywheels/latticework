#!/usr/bin/env python3
"""Re-score the cached candidates (no network) with a media-qualifier filter, so
pop-culture articles ('Game Theory (album)', 'Equilibrium (film)') can never win
over the base concept. Rewrites /tmp/refs-resolved.json in place.

The bug this fixes: exact title matching stripped parentheticals, so a disambiguated
media title looked identical to the concept name. Here a title whose parenthetical is
a media/work qualifier is disqualified outright (unless the model is itself about art
/ narrative), and clean base titles are preferred over any parenthetical.
"""
import json, re

RES = '/tmp/refs-resolved.json'
MEDIA = {'film', 'films', 'movie', 'album', 'albums', 'song', 'songs', 'band', 'novel',
         'book', 'novella', 'tv series', 'television series', 'video game', 'game',
         'ep', 'single', 'miniseries', 'musician', 'singer', 'rapper', 'actor',
         'actress', 'play', 'opera', 'comics', 'comic', 'franchise', 'magazine',
         'sculpture', 'painting', 'poem', 'manga', 'anime', 'tv', 'series',
         'soundtrack', 'record label', 'wrestler', 'footballer', 'video', 'mixtape',
         'musical', 'sitcom', 'operating system', 'software', 'company', 'song cycle',
         'Windows', 'windows', 'app', 'website', 'radio', 'magazine', 'newspaper'}


STOP = set('the a an of and or vs versus to in on for with by as is are be its it your you '
           'that this these those effect law model theory principle bias fallacy'.split())


def _stem(w):
    for suf in ('ies', 'es', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)] + ('y' if suf == 'ies' else '')
    return w


def _toks(s):
    s = re.sub(r'\([^)]*\)', ' ', s or '')
    s = re.sub(r'[^a-z0-9 ]', ' ', s.lower())
    return {_stem(w) for w in s.split() if w not in STOP and len(w) > 2}


def paren(t):
    m = re.findall(r'\(([^)]*)\)', t)
    return m[-1].strip().lower() if m else ''


def rescore():
    d = json.load(open(RES))
    tiers = {'HIGH': 0, 'MED': 0, 'LOW': 0, 'NONE': 0}
    for m in d['models']:
        is_art = 'Art' in m['disc'] or 'Narrative' in m['disc']
        cands = []
        for c in m['candidates']:
            p = paren(c['title'])
            media = p in MEDIA and not is_art
            c = {**c, 'media': media, 'has_paren': bool(p)}
            cands.append(c)
        # eligible = non-media; media ones survive only as last resort
        elig = [c for c in cands if not c['media']] or cands
        # rank: exact & clean base title, then non-disambig, then definition overlap
        elig.sort(key=lambda c: (
            c['exact'] and not c['disambig'] and not c['has_paren'],
            c['exact'] and not c['disambig'],
            not c['disambig'],
            round(c['jac'] + 1.5 * c['ext_ov'], 3),
        ), reverse=True)
        best = elig[0] if elig else None
        m['candidates'] = elig[:5]
        m['best'] = best
        # Only AUTO-TRUST (HIGH) when the article is the same concept or a more
        # GENERAL one (title tokens ⊆ name tokens), with some overlap support. A
        # more-specific or sibling exact title ('Hydrostatic equilibrium' for
        # 'Equilibrium') is plausible but must be eyeballed → MED.
        nt = set(_toks(m['name']))
        bt = set(_toks(best['title'])) if best else set()
        general = best and not best['has_paren'] and bt and bt <= nt
        supported = best and (best['jac'] >= 0.6 or best['ext_ov'] > 0)
        if best and best['media']:
            tier = 'NONE'
        elif best and best['exact'] and not best['disambig'] and general and supported:
            tier = 'HIGH'
        elif best and not best['disambig'] and (best['exact'] or best['jac'] >= 0.34 or best['ext_ov'] >= 0.3):
            tier = 'MED'
        elif best and not best['disambig'] and (best['jac'] > 0 or best['ext_ov'] > 0.12):
            tier = 'LOW'
        else:
            tier = 'NONE'
        m['tier'] = tier
        tiers[tier] += 1
    d['tiers'] = tiers
    json.dump(d, open(RES, 'w'), indent=1, ensure_ascii=False)
    print('rescored TIERS:', tiers)


if __name__ == '__main__':
    rescore()
