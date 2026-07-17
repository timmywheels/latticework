# Latticework

A visual field guide to 100 mental models — the big ideas from the big disciplines, each set as a numbered plate and wired to its neighbors. After C. T. Munger's lattice of models.

Implemented from the Claude Design project _Latticework Scaffold_ (almanack direction: warm paper, Newsreader + IBM Plex Mono, retro-futurist plates).

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7 (`/` · `/models/:id` · `/lattice` · `/colophon`)
- Motion (route crossfades, plate transitions, node hover springs)

## Development

```bash
npm install
npm run dev     # start dev server
npm run build   # typecheck + production build
```

## Structure

- `src/data/models.ts` — the 18 typeset models (of 100 planned), discipline order, planned counts
- `src/views/` — the four views: index ledger, model plate detail, lattice graph, colophon
- `src/components/` — masthead, footer, plate art (fig. 012), hatched plate placeholder
- `src/hooks/useStudied.ts` — studied marks, persisted to `localStorage` under `latticework-studied`

## Design tokens

Palette (defined in `src/index.css` via Tailwind `@theme`): paper `#F3EFE4` · card `#FBF8F0` · ink `#211D14` · ember `#C65A2E` · verdigris `#2E7F74`.

Marks: ✦ studied · ✧ unread · ⁘ n connections · «…» plate captions.
