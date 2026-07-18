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
    <div className="mt-[22px] border border-dotted border-prussian/40 bg-card/60 p-4">
      {/* label + descriptor ride together on the left; the button centers against
          the whole block so it never crowds the line under it */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex cursor-pointer items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone transition-colors duration-150 hover:text-ink"
          >
            <span className="text-[8px]">{open ? '▾' : '▸'}</span>
            USE IT WITH AN LLM
          </button>
          <div className="mt-1.5 font-serif text-[13px] italic leading-[1.4] text-drab">
            {p.use}
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => copy(p.body)}
          className="flex-none cursor-pointer self-center rounded-[2px] px-[14px] py-[8px] font-mono text-[10px] font-medium tracking-[0.1em] text-card transition-colors duration-200"
          style={{ background: copied ? '#3f5d7a' : '#211d14' }}
        >
          {copied ? 'COPIED ✓' : 'COPY AS PROMPT ⧉'}
        </motion.button>
      </div>
      {open && (
        <pre className="mt-3.5 max-h-[340px] overflow-y-auto whitespace-pre-wrap border-t border-ink/12 pt-3 font-mono text-[11px] leading-[1.6] text-umber">
          {p.body}
        </pre>
      )}
    </div>
  )
}
