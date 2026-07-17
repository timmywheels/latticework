import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { MODELS } from '../data/models'
import { StitchMark } from './StitchMark'

interface MastheadProps {
  studiedCount: number
  savedCount: number
}

const NAV_ITEMS = [
  { name: 'ALMANACK', to: '/' },
  { name: 'LATTICE', to: '/lattice' },
  { name: 'SHELF', to: '/saved' },
]

export function Masthead({ studiedCount, savedCount }: MastheadProps) {
  const { pathname } = useLocation()

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' || pathname.startsWith('/models') : pathname.startsWith(to)

  return (
    <div className="border-b-2 border-ink/16">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-7 md:py-4">
        <Link to="/" className="flex cursor-pointer items-baseline gap-3.5">
          {/* self-center keeps the mark optically centered while the wordmark and
              tagline share a true text baseline */}
          <span className="self-center">
            <StitchMark size={19} />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-[-0.01em]">latticework.</span>
          <span className="hidden font-mono text-[10px] tracking-[0.14em] text-stone lg:inline">
            A FIELD GUIDE FOR THINKERS
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`cursor-pointer border-b-2 pb-0.5 font-mono text-[11px] font-medium transition-colors duration-150 hover:text-ink ${
                isActive(item.to) ? 'border-ember text-ink' : 'border-transparent text-stone'
              }`}
            >
              {item.name}
            </Link>
          ))}
          {savedCount > 0 && (
            <Link
              to="/saved"
              className="rounded-full border border-ember/40 px-2.5 py-1 font-mono text-[10.5px] font-medium text-ember transition-colors duration-150 hover:border-ember"
            >
              <motion.span
                key={savedCount}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="inline-block"
              >
                {savedCount}
              </motion.span>{' '}
              SAVED ❖
            </Link>
          )}
          <span className="rounded-full border border-prussian/40 px-2.5 py-1 font-mono text-[10.5px] font-medium text-prussian">
            <motion.span
              key={studiedCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="inline-block"
            >
              {studiedCount}
            </motion.span>
            <span className="hidden sm:inline"> OF {MODELS.length}</span> STUDIED
          </span>
        </div>
      </div>
    </div>
  )
}
