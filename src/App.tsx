import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useStudied } from './hooks/useStudied'
import { useSaved } from './hooks/useSaved'
import { Masthead } from './components/Masthead'
import { Footer } from './components/Footer'
import { IndexView } from './views/IndexView'
import { ModelDetailView } from './views/ModelDetailView'
import { LatticeView } from './views/LatticeView'
import { ColophonView } from './views/ColophonView'
import { SavedView } from './views/SavedView'

export default function App() {
  const { studied, toggleStudied } = useStudied()
  const { saved, toggleSaved } = useSaved()
  const location = useLocation()
  // crossfade between sections; model-to-model changes animate inside the detail view
  const section = location.pathname.split('/')[1] || 'index'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Masthead studiedCount={studied.length} savedCount={saved.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex flex-1 flex-col"
        >
          <Routes location={location}>
            <Route path="/" element={<IndexView studied={studied} saved={saved} />} />
            <Route
              path="/models/:id"
              element={
                <ModelDetailView
                  studied={studied}
                  onToggleStudied={toggleStudied}
                  saved={saved}
                  onToggleSaved={toggleSaved}
                />
              }
            />
            <Route path="/lattice" element={<LatticeView studied={studied} />} />
            <Route
              path="/saved"
              element={<SavedView saved={saved} studied={studied} onToggleSaved={toggleSaved} />}
            />
            <Route path="/colophon" element={<ColophonView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      <Footer />
    </div>
  )
}
