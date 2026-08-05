type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  withBackground?: boolean
}

const sizeClass = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const

export function BrandLogo({
  size = 'md',
  className = '',
  withBackground = true,
}: BrandLogoProps) {
  return (
    <img
      src="/dost-logo.svg"
      alt="DOST logo"
      className={[
        'shrink-0 object-contain',
        sizeClass[size],
        withBackground ? 'rounded-md bg-white p-0.5 shadow-sm' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
