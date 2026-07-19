import { Link, Navigate, useParams } from 'react-router'
import {
  DISCIPLINE_LABELS,
  DISCIPLINE_ORDER,
  MODELS,
  PEOPLE,
  modelPath,
  type Discipline,
  type Model,
} from '../data/models'
import { portraitFor } from '../data/portraits'

/**
 * A thinker's shelf: their portrait and every model in the catalog attributed to
 * them, grouped by discipline. The reading counterpart to the lattice graph —
 * where the graph shows a person's models scattered across the whole field, this
 * gathers them into one list you can actually work down.
 */
export function ThinkerView() {
  const { slug = '' } = useParams()
  const person = PEOPLE.find((p) => p.slug === slug)
  if (!person) return <Navigate to="/lattice" replace />

  const portrait = portraitFor(slug)
  const models = MODELS.filter((m) => (m.thinkers ?? []).includes(slug))

  // group by discipline, in the catalog's canonical order, so a person who spans
  // fields reads as a lattice of their own
  const byDisc = DISCIPLINE_ORDER.map((d) => ({
    disc: d,
    items: models
      .filter((m) => m.disc === d)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0)

  const first = person.name.split(' ')[0]

  return (
    <div className="mx-auto w-full max-w-[1120px] box-border px-4 pb-16 pt-6 md:px-7 md:pt-[30px]">
      <Link
        to="/lattice"
        className="inline-block font-mono text-[9.5px] tracking-[0.16em] text-stone transition-colors duration-150 hover:text-ember"
      >
        ← ALL THINKERS
      </Link>

      {/* frontispiece — portrait + who they are */}
      <div className="mt-5 flex flex-col items-start gap-5 border-b border-ink/12 pb-7 sm:flex-row sm:items-center sm:gap-7">
        <div className="relative h-[112px] w-[112px] flex-none md:h-[132px] md:w-[132px]">
          <div className="absolute inset-0 rounded-full border border-ink/25" />
          <div className="absolute inset-[5px] overflow-hidden rounded-full border border-ink/15 bg-card shadow-[0_1px_10px_rgba(33,29,20,0.10)]">
            {portrait ? (
              <img
                src={portrait}
                alt={`Engraved portrait of ${person.name}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-[34px] text-ink/30">
                {person.name.split(' ').slice(-1)[0][0]}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="font-serif text-[32px] font-medium leading-[1.05] tracking-[-0.015em] md:text-[42px] [font-optical-sizing:none]">
            {person.name}
          </h1>
          <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-stone">
            {person.count} {person.count === 1 ? 'MODEL' : 'MODELS'} · {byDisc.length}{' '}
            {byDisc.length === 1 ? 'DISCIPLINE' : 'DISCIPLINES'}
          </div>
          <p className="mt-3 max-w-[46ch] font-serif text-[15px] italic leading-[1.5] text-drab">
            Every model in the latticework that runs through {first}’s thinking,
            gathered here by discipline.
          </p>
          <Link
            to={`/lattice?who=${slug}`}
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[0.14em] text-ember transition-colors duration-150 hover:text-ink"
          >
            SEE THEM HIGHLIGHTED IN THE LATTICE →
          </Link>
        </div>
      </div>

      {/* the shelf */}
      <div className="mt-8 space-y-8">
        {byDisc.map((g) => (
          <section key={g.disc}>
            <div className="mb-1 flex items-baseline gap-2 border-b border-dotted border-ink/25 pb-1.5">
              <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-ink">
                {DISCIPLINE_LABELS[g.disc as Discipline] ?? g.disc}
              </span>
              <span className="font-mono text-[9px] text-faded">{g.items.length}</span>
            </div>
            <ul>
              {g.items.map((m) => (
                <ThinkerRow key={m.id} m={m} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function ThinkerRow({ m }: { m: Model }) {
  return (
    <li>
      <Link
        to={modelPath(m)}
        className="group flex items-center gap-3.5 border-b border-dotted border-ink/15 px-1 py-3 transition-[background-color] duration-150 hover:bg-card"
      >
        <span className="w-[54px] flex-none font-mono text-[10.5px] font-medium text-ember">
          {m.id}
        </span>
        <span className="min-w-0 flex-[3] font-serif text-[16px] font-medium leading-tight transition-colors duration-150 group-hover:text-ember md:text-[17px]">
          {m.name}
        </span>
        <span className="hidden min-w-0 flex-[2] truncate font-serif text-[12.5px] italic text-drab md:block">
          {m.blurb}
        </span>
        <span className="w-[14px] flex-none text-right font-mono text-[13px] text-faded transition-colors duration-150 group-hover:text-ember">
          ›
        </span>
      </Link>
    </li>
  )
}
