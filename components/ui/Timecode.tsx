import { cn } from '@/lib/utils/cn'
import { formatDuration, formatTimecode } from '@/lib/utils/time'

export interface TimecodeProps {
  seconds: number
  /** `precise` → 01:23.45 (position de lecture) · `duration` → 1:23 (listes) */
  mode?: 'precise' | 'duration'
  className?: string
}

export function Timecode({ seconds, mode = 'precise', className }: TimecodeProps) {
  const text = mode === 'precise' ? formatTimecode(seconds) : formatDuration(seconds)
  return (
    <span className={cn('tnum text-muted font-mono text-[13px] font-medium', className)}>
      {text}
    </span>
  )
}
