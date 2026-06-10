/**
 * SproutIcon — The GrowT brand mark SVG.
 * A gentle sprout/leaf motif that communicates "growth."
 */
export function SproutIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Stem */}
      <path
        d="M12 20V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M12 15C12 15 8.5 14.5 7 11.5C7 11.5 9.5 8.5 12 10.5"
        fill="currentColor"
        fillOpacity="0.30"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right leaf */}
      <path
        d="M12 12C12 12 15.5 11.5 17 8.5C17 8.5 14.5 5.5 12 7.5"
        fill="currentColor"
        fillOpacity="0.30"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ground dots */}
      <circle cx="9.5"  cy="21" r="1"   fill="currentColor" fillOpacity="0.40" />
      <circle cx="12"   cy="21.5" r="1" fill="currentColor" fillOpacity="0.55" />
      <circle cx="14.5" cy="21" r="1"   fill="currentColor" fillOpacity="0.40" />
    </svg>
  )
}
