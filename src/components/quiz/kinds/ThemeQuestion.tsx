'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import { DIFFICULTY_LABELS, type QuestionComponentProps, type ThemePayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'
import { useT } from '@/lib/i18n'

const TONES: Record<number, string> = {
  1: 'text-ok',
  2: 'text-warn',
  3: 'text-rec',
}

/**
 * Le thème à difficulté choisie.
 *
 * On annonce le sujet, pas la question : le joueur parie sur ce qu'il
 * pense savoir, et décide lui-même de ce que sa réponse vaudra. C'est le
 * seul endroit du quiz où deux joueurs ne répondent pas à la même chose,
 * et c'est précisément ce qui le rend intéressant à regarder : celui qui
 * prend la difficile devant tout le monde s'expose.
 *
 * Le choix est définitif. Pouvoir revenir en arrière après avoir lu
 * l'énoncé transformerait le pari en simple menu.
 */
export function ThemeQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<
  ThemePayload,
  { kind: 'theme'; level: number; text: string }
>) {
  const t = useT()
  const [level, setLevel] = useState<number | null>(value?.level ?? null)
  const [text, setText] = useState(value?.text ?? '')

  useEffect(() => {
    setLevel(value?.level ?? null)
    setText(value?.text ?? '')
  }, [payload.theme, value?.level, value?.text])

  const chosen = payload.levels.find((entry) => entry.level === level) ?? null

  function choose(next: number) {
    if (disabled || level !== null) return
    setLevel(next)
    // Le choix compte déjà comme une réponse : sans cet envoi, quitter la
    // question sans rien écrire perdrait jusqu'au niveau choisi.
    onChange({ kind: 'theme', level: next, text })
  }

  function write(next: string) {
    setText(next)
    if (level !== null) onChange({ kind: 'theme', level, text: next })
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="eyebrow text-faint">{t.forms.theme}</p>
        <p className="text-fg mt-1 text-[19px] font-medium">{payload.theme}</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {payload.levels.map((entry) => {
          const active = level === entry.level
          const dimmed = level !== null && !active

          return (
            <button
              key={entry.level}
              type="button"
              disabled={disabled || level !== null}
              onClick={() => choose(entry.level)}
              className={cn(
                'rounded-token px-3 py-3 text-center',
                'transition-[background-color,color,opacity,transform] duration-200',
                'active:scale-[0.98]',
                active ? 'bg-accent text-on-accent' : 'bg-sunken',
                dimmed && 'opacity-40',
                level === null && !disabled && 'hover:bg-accent-soft',
              )}
            >
              <span
                className={cn(
                  'eyebrow block',
                  active ? 'text-on-accent' : TONES[entry.level],
                )}
              >
                {DIFFICULTY_LABELS[entry.level]}
              </span>
              <span
                className={cn(
                  'mt-1 block text-[13px]',
                  active ? 'text-on-accent/85' : 'text-faint',
                )}
              >
                {entry.points} point{entry.points > 1 ? 's' : ''}
              </span>
            </button>
          )
        })}
      </div>

      {chosen ? (
        <div className="space-y-3">
          <p className="text-fg text-[17px] text-balance">{chosen.prompt}</p>
          <Input
            label={t.forms.yourAnswer}
            value={text}
            placeholder={t.forms.typeHere}
            disabled={disabled}
            maxLength={80}
            autoFocus
            onChange={(event) => write(event.target.value)}
          />
        </div>
      ) : (
        <p className="text-faint text-center text-[13px]">
          Choisissez votre difficulté pour découvrir la question. Le choix est
          définitif.
        </p>
      )}
    </div>
  )
}
