import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-deep shadow-[0_1px_0_rgba(255,255,255,0.15)_inset] disabled:opacity-50',
  secondary:
    'bg-card text-ink border border-line hover:border-accent/30 hover:bg-surface disabled:opacity-50',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-ink/5 disabled:opacity-50',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
