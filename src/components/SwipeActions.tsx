import { useState, useRef, type ReactNode, type TouchEvent } from 'react'

type SwipeActionsProps = {
  children: ReactNode
  rightAction?: ReactNode
  rightActionCallback?: () => void
  leftAction?: ReactNode
  leftActionCallback?: () => void
  threshold?: number
}

export function SwipeActions({
  children,
  rightAction,
  rightActionCallback,
  leftAction,
  leftActionCallback,
  threshold = 60
}: SwipeActionsProps) {
  const [offset, setOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [actionTriggered, setActionTriggered] = useState(false)
  
  const startX = useRef<number | null>(null)
  const currentX = useRef<number | null>(null)

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsSwiping(true)
    setActionTriggered(false)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!startX.current || !isSwiping) return

    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current

    // Limit swipe based on available actions
    if (diff < 0 && !rightAction) return
    if (diff > 0 && !leftAction) return

    // Cap the visual offset
    const maxOffset = 100
    const boundedDiff = Math.max(-maxOffset, Math.min(maxOffset, diff))
    setOffset(boundedDiff)

    // Trigger feedback if past threshold
    if (Math.abs(diff) > threshold && !actionTriggered) {
      if ('vibrate' in navigator && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
        try {
          navigator.vibrate(50)
        } catch (e) {
          // Ignore
        }
      }
      setActionTriggered(true)
    } else if (Math.abs(diff) <= threshold && actionTriggered) {
      setActionTriggered(false)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    
    if (startX.current !== null && currentX.current !== null) {
      const diff = currentX.current - startX.current
      
      if (diff < -threshold && rightActionCallback) {
        rightActionCallback()
      } else if (diff > threshold && leftActionCallback) {
        leftActionCallback()
      }
    }

    // Reset state
    startX.current = null
    currentX.current = null
    setOffset(0)
    setActionTriggered(false)
  }

  return (
    <div className="relative overflow-hidden w-full">
      {/* Left Action Background */}
      {leftAction && (
        <div 
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-6 px-4 w-1/2 transition-opacity duration-200 ${offset > 0 ? 'opacity-100' : 'opacity-0'} ${offset > threshold ? 'bg-error/20 text-error' : 'bg-surface-variant text-on-surface-variant'}`}
          style={{ zIndex: 0 }}
        >
          {leftAction}
        </div>
      )}
      
      {/* Right Action Background */}
      {rightAction && (
        <div 
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-6 px-4 w-1/2 transition-opacity duration-200 ${offset < 0 ? 'opacity-100' : 'opacity-0'} ${offset < -threshold ? 'bg-error/20 text-error' : 'bg-surface-variant text-on-surface-variant'}`}
          style={{ zIndex: 0 }}
        >
          {rightAction}
        </div>
      )}

      {/* Foreground Content */}
      <div 
        className="relative z-10 w-full transition-transform"
        style={{ 
          transform: `translateX(${offset}px)`,
          transitionDuration: isSwiping ? '0ms' : '300ms'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
