import { PEOPLE, PROVENANCE_LABELS, type Model } from '../data/models'

const PROV_DOT: Record<string, string> = {
  'munger-named': '#c65a2e',
  'munger-used': '#d98b64',
  'munger-adjacent': '#3f5d7a',
  community: '#8a8272',
  'canon-addition': '#b0a894',
}

interface ModelPopoverProps {
  model: Model
  /** shows the action row — used by the big lattice, omitted on hover cards */
  onOpen?: () => void
  onClose?: () => void
}

/**
 * The card shown when a node is hovered (mini lattice) or clicked (big lattice).
 * Deliberately does NOT pull in EXAMPLES or PROMPTS — those live in the plate's
 * lazy chunk, and importing them here would drag ~2MB back onto the entry bundle.
 */
export function ModelPopover({ model, onOpen, onClose }: ModelPopoverProps) {
  const thinkers = (model.thinkers ?? [])
    .map((t) => PEOPLE.find((p) => p.slug === t)?.name)
    .filter(Boolean)

  return (
    <div className="w-[290px] border border-ink/70 bg-card shadow-[3px_3px_0_rgba(33,29,20,.18)]">
      <div className="flex items-baseline justify-between border-b border-ink/12 px-3 py-1.5">
        <span className="font-mono text-[9px] font-medium tracking-[0.14em] text-ember">
          {model.id} — {model.disc}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer font-mono text-[10px] text-stone transition-colors duration-150 hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      <div className="px-3 py-2.5">
        <div className="font-serif text-[17px] font-medium leading-[1.15]">{model.name}</div>
        <div className="mt-1 font-serif text-[12.5px] italic leading-[1.4] text-ember">
          {model.blurb}
        </div>
        <div className="mt-2 line-clamp-3 font-serif text-[12px] leading-[1.5] text-drab">
          {model.long}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/10 pt-2 font-mono text-[9px] text-stone">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{ background: PROV_DOT[model.provenance] }}
            />
            {PROVENANCE_LABELS[model.provenance].toUpperCase()}
          </span>
          <span className="text-prussian">⁘ {model.links.length}</span>
        </div>

        {thinkers.length > 0 && (
          <div className="mt-1 font-mono text-[9px] leading-[1.5] text-faded">
            {thinkers.join(' · ')}
          </div>
        )}

        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="mt-2.5 w-full cursor-pointer rounded-[2px] bg-ink py-[7px] text-center font-mono text-[10px] font-medium tracking-[0.1em] text-card transition-colors duration-150 hover:bg-ember"
          >
            READ THE FULL PLATE ▸
          </button>
        )}
      </div>
    </div>
  )
}
