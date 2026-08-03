/**
 * Point d'import unique du kit d'interface.
 *
 *   import { Button, Panel } from '@/components/ui'
 *
 * Aucun composant d'ici ne connaît de concept métier : ils ignorent ce
 * qu'est une scène, un joueur ou une prise. Toute la logique reste dans
 * les composants de `components/video/`, `components/record/` et
 * `components/room/`, qui les consomment.
 */
export { Badge, type BadgeProps } from './Badge'
export { Button, buttonClassName, type ButtonProps } from './Button'
export { Dialog, type DialogProps } from './Dialog'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { IconButton, type IconButtonProps } from './IconButton'
export { Input, type InputProps } from './Input'
export { Panel, type PanelProps } from './Panel'
export { Spinner, type SpinnerProps } from './Spinner'
export { ThemeToggle } from './ThemeToggle'
export { Timecode, type TimecodeProps } from './Timecode'
