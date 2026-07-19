import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useStudied } from "./hooks/useStudied";
import { useSaved } from "./hooks/useSaved";
import { useKeys } from "./hooks/useKeys";
import { Masthead } from "./components/Masthead";
import { HotkeysPanel } from "./components/HotkeysPanel";
import { SearchPalette } from "./components/SearchPalette";
import { Footer } from "./components/Footer";
import { IndexView } from "./views/IndexView";
import { LatticeView } from "./views/LatticeView";
import { ThinkerView } from "./views/ThinkerView";
import { ColophonView } from "./views/ColophonView";
import { modelPath, randomModel } from "./data/models";

// The plate is the only view that needs the examples (~430KB) and the prompt
// library (~1.7MB). Splitting it keeps that weight off the index and lattice,
// which is where most visits start and many end.
const ModelDetailView = lazy(() =>
  import("./views/ModelDetailView").then((m) => ({
    default: m.ModelDetailView,
  })),
);
const SavedView = lazy(() =>
  import("./views/SavedView").then((m) => ({ default: m.SavedView })),
);

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-7 pt-[26px]">
      <div className="font-mono text-[10px] tracking-[0.1em] text-faded">
        LOADING PLATE…
      </div>
    </div>
  );
}

export default function App() {
  const { studied, toggleStudied } = useStudied();
  const { saved, toggleSaved } = useSaved();
  const location = useLocation();
  const navigate = useNavigate();
  const [keysOpen, setKeysOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // crossfade between sections; model-to-model changes animate inside the detail view
  const section = location.pathname.split("/")[1] || "index";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // ⌘K / Ctrl+K opens search from anywhere; useKeys skips chords, so listen here
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useKeys((e) => {
    if (e.key === "/") {
      e.preventDefault();
      setSearchOpen(true);
    } else if (e.key === "?") {
      setKeysOpen((v) => !v);
    } else if (e.key === "i") {
      navigate("/");
    } else if (e.key === "l") {
      navigate("/lattice");
    } else if (e.key === "s") {
      navigate("/saved");
    } else if (e.key === "r" && !location.pathname.startsWith("/lattice")) {
      // on the lattice, r resets the view (handled in LatticeView), so yield here
      navigate(modelPath(randomModel()));
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Masthead
        studiedCount={studied.length}
        savedCount={saved.length}
        onSearch={() => setSearchOpen(true)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex flex-1 flex-col"
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes location={location}>
              <Route
                path="/"
                element={<IndexView studied={studied} saved={saved} />}
              />
              <Route
                path="/models/:slug"
                element={
                  <ModelDetailView
                    studied={studied}
                    onToggleStudied={toggleStudied}
                    saved={saved}
                    onToggleSaved={toggleSaved}
                  />
                }
              />
              <Route
                path="/lattice"
                element={<LatticeView studied={studied} />}
              />
              <Route path="/thinkers/:slug" element={<ThinkerView />} />
              <Route
                path="/saved"
                element={
                  <SavedView
                    saved={saved}
                    studied={studied}
                    onToggleSaved={toggleSaved}
                  />
                }
              />
              <Route path="/colophon" element={<ColophonView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <Footer />
      <HotkeysPanel open={keysOpen} onToggle={() => setKeysOpen((v) => !v)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
