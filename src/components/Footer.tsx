export function Footer() {
  return (
    <div className="mt-auto border-t border-ink/16">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-4 font-mono text-[9.5px] tracking-[0.12em] text-stone md:flex-row md:items-center md:justify-between md:gap-4 md:px-7">
        <span>LATTICEWORK.PAGE – A FIELD GUIDE FOR DECISION-MAKING</span>
        <div className="flex items-center gap-x-3">
          <a
            href="https://github.com/timmywheels/latticework"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors duration-150 hover:text-ink"
          >
            GITHUB ↗
          </a>
          <span className="text-ink/20">·</span>
          <a
            href="https://timwheeler.com?utm_source=latticework&utm_medium=footer&utm_campaign=latticework"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors duration-150 hover:text-ember"
          >
            BY TIM WHEELER ↗
          </a>
        </div>
      </div>
    </div>
  )
}
