import { EXAMPLES } from '../data/examples'

interface ExamplesProps {
  id: string
}

/**
 * Worked examples. A definition tells you what a model is; these are what make
 * it stick, so they sit directly under the prose rather than at the foot of the
 * plate. Renders nothing when a plate has none, rather than an empty heading.
 */
export function Examples({ id }: ExamplesProps) {
  const rows = EXAMPLES[id]
  if (!rows?.length) return null

  return (
    <div className="mt-7">
      <div className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
        IN PRACTICE
      </div>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {rows.map((e, i) => (
          <div
            key={i}
            className="border-l-2 border-verdigris/35 bg-card/70 py-2 pl-3.5 pr-3 transition-colors duration-150 hover:border-ember/60"
          >
            <div className="font-mono text-[9px] font-medium tracking-[0.14em] text-verdigris">
              {e.context.toUpperCase()}
            </div>
            <div className="mt-1 font-serif text-[14px] leading-[1.6] text-umber">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
