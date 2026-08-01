import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'accent' | 'rec' | 'ok' | 'warn' | 'player-1' | 'player-2'

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted',
  accent: 'bg-accent-soft text-accent',
  rec: 'bg-rec/10 text-rec',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  'player-1': 'bg-player-1/10 text-player-1',
  'player-2': 'bg-player-2/10 text-player-2',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-token inline-flex h-6 items-center px-2 text-[13px] font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
