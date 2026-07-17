import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { DISCIPLINE_ORDER, MODELS_BY_ID, modelPath, type Model } from '../data/models'
import { buildPromptPack } from '../lib/promptPack'
import { useCopy } from '../hooks/useCopy'

interface SavedViewProps {
  saved: string[]
  studied: string[]
  onToggleSaved: (id: string) => void
}

export function SavedView({ saved, studied, onToggleSaved }: SavedViewProps) {
  const navigate = useNavigate()
  const { copied, copy } = useCopy()
  const models = saved.map((id) => MODELS_BY_ID[id]).filter(Boolean) as Model[]

  const groups = DISCIPLINE_ORDER.map((d) => ({
    name: d,
    rows: models.filter((m) => m.disc === d),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="mx-auto w-full max-w-[1120px] box-border px-7 pb-12 pt-[30px]">
      <div className="flex items-baseline justify-between border-b border-ink/16 pb-4">
        <div className="font-serif text-[32px] font-medium tracking-[-0.01em]">Your shelf.</div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] tracking-[0.1em] text-stone">
            {models.length} SAVED · {models.filter((m) => studied.includes(m.id)).length} OF THEM
            STUDIED
          </div>
          {models.length > 0 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => copy(buildPromptPack(models))}
              title="Copy all saved models as one checklist prompt"
              className="cursor-pointer rounded-[2px] px-[14px] py-[7px] font-mono text-[10px] font-medium tracking-[0.1em] text-card transition-colors duration-200"
              style={{ background: copied ? '#3f5d7a' : '#211d14' }}
            >
              {copied ? 'COPIED ✓' : 'COPY SHELF AS PROMPT ⧉'}
            </motion.button>
          )}
        </div>
      </div>

      {models.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="font-serif text-[22px] italic text-drab">Nothing saved yet.</div>
          <div className="max-w-[420px] font-serif text-[14px] leading-[1.6] text-stone">
            Mark a model with <span className="text-ember">❖ SAVE</span> and it lands here — a
            shelf of the models you mean to come back to, separate from the ones you have already
            studied. Collect a few and you can copy the whole shelf as one checklist prompt.
          </div>
          <Link
            to="/"
            className="mt-3 cursor-pointer rounded-[2px] bg-ink px-5 py-[9px] font-mono text-[10.5px] font-medium tracking-[0.1em] text-card transition-colors duration-150 hover:bg-ember"
          >
            BROWSE THE ALMANACK ▸
          </Link>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.name} className="mt-2">
            <div className="flex justify-between border-b border-ink/14 px-1 pb-2 pt-4">
              <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                {g.name}
              </span>
              <span className="font-mono text-[9.5px] text-faded">{g.rows.length}</span>
            </div>
            {g.rows.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(modelPath(m), { state: { from: '/saved' } })}
                className="flex cursor-pointer items-baseline gap-3.5 border-b border-dotted border-ink/20 px-1 py-[13px] transition-colors duration-150 hover:bg-card"
              >
                <span className="w-[42px] flex-none font-mono text-[11px] font-medium text-ember">
                  {m.id}
                </span>
                <span className="min-w-0 flex-1 font-serif text-[16px] font-medium md:w-[220px] md:flex-none md:text-[17px]">
                  {m.name}
                </span>
                <span className="hidden min-w-0 flex-1 font-serif text-[12.5px] italic leading-[1.4] text-drab md:block">
                  {m.blurb}
                </span>
                <span
                  className="flex-none font-serif text-[13px]"
                  style={{ color: studied.includes(m.id) ? '#c65a2e' : '#d8d2c2' }}
                >
                  {studied.includes(m.id) ? '✦' : '✧'}
                </span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSaved(m.id)
                  }}
                  className="flex-none cursor-pointer font-mono text-[9.5px] text-faded transition-colors duration-150 hover:text-ember"
                >
                  REMOVE
                </motion.button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
