import type { Model } from '../data/models'

/**
 * Builds one prompt from a set of plates — the latticework thesis made
 * operational. Munger's actual method wasn't one model at a time; it was running
 * the whole checklist and watching for the places where several point the same
 * way. Individual prompts can't do that. This can.
 */
export function buildPromptPack(models: Model[]): string {
  const list = models
    .map((m, i) => `${i + 1}. ${m.name} — ${m.blurb.replace(/\.$/, '')}`)
    .join('\n')

  return `Apply the following ${models.length} mental models to my situation, as a checklist.

Work through them one at a time. For each, apply it honestly and report ONLY what it actually surfaces about my situation. If a model doesn't fit, skip it and say so in one line — do not force it. A model bent to fit is worse than a model left out.

THE CHECKLIST:
${list}

Then do three things:
1. Name the two or three models that most changed your read of my situation, and what each one surfaced that I'd otherwise have missed.
2. Name any model that points the OPPOSITE way from the others, and say why it might be the one that's right.
3. Look for a lollapalooza: places where several of these models push toward the same outcome at once. Compounding forces are where the extreme results — good and bad — actually come from. If you find one, say so plainly and say how big it looks.

Be concrete about my situation throughout. No generic advice I could have read anywhere.

MY SITUATION:
<<< PASTE YOURS HERE >>>`
}
