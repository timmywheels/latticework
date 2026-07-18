import { PRIMARY_SOURCE_TYPES, SOURCES, type Model } from '../data/models'

interface SourceListProps {
  model: Model
}

/**
 * The sources a model traces to, split the way the catalog thinks about
 * provenance: what Munger said in his own words vs. the later compilations that
 * catalogued it. A model with neither (a canon/thinker addition) renders nothing.
 */
export function SourceList({ model }: SourceListProps) {
  const ids = model.sources ?? []
  if (!ids.length) return null

  const rows = ids.map((id) => SOURCES[id]).filter(Boolean)
  const primary = rows.filter((s) => PRIMARY_SOURCE_TYPES.has(s.type))
  const secondary = rows.filter((s) => !PRIMARY_SOURCE_TYPES.has(s.type))

  const group = (label: string, items: typeof rows) =>
    items.length === 0 ? null : (
      <>
        <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
          {label}
        </dt>
        <dd className="mt-1.5 flex flex-col gap-1.5">
          {items.map((s) =>
            s.url ? (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.attributionNote || s.supports}
                className="group cursor-pointer font-serif text-[12.5px] leading-[1.35] text-prussian transition-colors duration-150 hover:text-ember"
              >
                <span className="border-b border-prussian/40 group-hover:border-ember">
                  {s.title}
                </span>
                {s.host && s.host !== s.creator && (
                  <span className="ml-1 font-mono text-[9px] text-faded">· {s.host}</span>
                )}
              </a>
            ) : (
              <span
                key={s.id}
                title={s.attributionNote || s.supports}
                className="font-serif text-[12.5px] leading-[1.35] text-drab"
              >
                {s.title}
                {s.host && s.host !== s.creator && (
                  <span className="ml-1 font-mono text-[9px] text-faded">· {s.host}</span>
                )}
              </span>
            ),
          )}
        </dd>
      </>
    )

  return (
    <>
      {group('IN MUNGER’S WORDS', primary)}
      {group('ALSO CATALOGUED IN', secondary)}
    </>
  )
}
