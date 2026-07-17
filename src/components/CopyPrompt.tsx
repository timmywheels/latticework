import { useState } from 'react'
import { motion } from 'motion/react'
import { PROMPTS } from '../data/prompts'
import { useCopy } from '../hooks/useCopy'

interface CopyPromptProps {
  id: string
}

/**
 * The plate's working end: a prompt that makes an LLM actually apply this model
 * to the reader's own problem. Shown, not hidden behind the button — a prompt
 * you can't read before you paste it is a prompt you can't trust or edit.
 */
export function CopyPrompt({ id }: CopyPromptProps) {
  const p = PROMPTS[id]
  const [open, setOpen] = useState(false)
  const { copied, copy } = useCopy()
  if (!p) return null

  return (
    <div className="mt-7 border border-dotted border-verdigris/40 bg-card/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            USE IT WITH AN LLM
          </div>
          <div className="mt-1 font-serif text-[13px] italic leading-[1.4] text-drab">{p.use}</div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer font-mono text-[9.5px] tracking-[0.08em] text-stone transition-colors duration-150 hover:text-ink"
          >
            {open ? 'HIDE' : 'READ IT'}
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => copy(p.body)}
            className="cursor-pointer rounded-[2px] px-[14px] py-[7px] font-mono text-[10px] font-medium tracking-[0.1em] text-card transition-colors duration-200"
            style={{ background: copied ? '#2e7f74' : '#211d14' }}
          >
            {copied ? 'COPIED ✓' : 'COPY AS PROMPT ⧉'}
          </motion.button>
        </div>
      </div>
      {open && (
        <pre className="mt-3 max-h-[340px] overflow-y-auto whitespace-pre-wrap border-t border-ink/12 pt-3 font-mono text-[11px] leading-[1.6] text-umber">
          {p.body}
        </pre>
      )}
    </div>
  )
}
