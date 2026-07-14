type GrowTLogoProps = {
  className?: string
  size?: number
}

export function GrowTLogo({ className, size = 40 }: GrowTLogoProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      height={size}
      src="/logo/logo.png"
      width={size}
    />
  )
}
