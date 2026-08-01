import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** Chasse fixe pour les codes de salon et les timecodes saisis à la main. */
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, mono = false, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-muted block text-[13px] font-medium">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'rounded-token bg-surface text-fg placeholder:text-faint h-10 w-full border px-3 text-[15px]',
          'transition-colors duration-150 outline-none',
          mono && 'font-mono tnum',
          error ? 'border-rec' : 'border-default focus:border-strong',
          'disabled:opacity-40',
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('text-[13px]', error ? 'text-rec' : 'text-faint')}>
          {message}
        </p>
      )}
    </div>
  )
})
