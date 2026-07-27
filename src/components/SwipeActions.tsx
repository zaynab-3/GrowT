import { useState, useRef, type ReactNode, type TouchEvent } from 'react'

type SwipeIntent = 'horizontal' | 'vertical' | null

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
  const startY = useRef<number | null>(null)
  const currentX = useRef<number | null>(null)
  const swipeIntent = useRef<SwipeIntent>(null)

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    currentX.current = e.touches[0].clientX
    swipeIntent.current = null
    setIsSwiping(false)
    setActionTriggered(false)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (startX.current === null || startY.current === null) return

    currentX.current = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diff = currentX.current - startX.current
    const verticalDiff = currentY - startY.current
    const absHorizontal = Math.abs(diff)
    const absVertical = Math.abs(verticalDiff)

    if (!swipeIntent.current) {
      if (absVertical > 8 && absVertical > absHorizontal * 1.15) {
        swipeIntent.current = 'vertical'
        setIsSwiping(false)
        setOffset(0)
        return
      }

      if (absHorizontal < 12 || absHorizontal < absVertical * 1.25) {
        return
      }

      swipeIntent.current = 'horizontal'
      setIsSwiping(true)
    }

    if (swipeIntent.current !== 'horizontal') return

    e.preventDefault()

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
        } catch {
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
    
    if (swipeIntent.current === 'horizontal' && startX.current !== null && currentX.current !== null) {
      const diff = currentX.current - startX.current
      
      if (diff < -threshold && rightActionCallback) {
        rightActionCallback()
      } else if (diff > threshold && leftActionCallback) {
        leftActionCallback()
      }
    }

    // Reset state
    startX.current = null
    startY.current = null
    currentX.current = null
    swipeIntent.current = null
    setOffset(0)
    setActionTriggered(false)
  }

  return (
    <div className="swipe-actions-container relative overflow-hidden w-full">
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
          transitionDuration: isSwiping ? '0ms' : '300ms',
          touchAction: 'pan-y'
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
