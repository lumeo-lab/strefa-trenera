import { type RefObject, useEffect } from 'react'

/**
 * Calls `onClose` when a click happens outside the given ref element.
 * Only active when `active` is true.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onClose, active])
}

/**
 * Calls `onClose` on any click or scroll event. Useful for floating menus
 * that should dismiss on any interaction outside.
 * Only active when `active` is true.
 */
export function useDismissOnInteraction(
  onClose: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return
    document.addEventListener('click', onClose)
    document.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('click', onClose)
      document.removeEventListener('scroll', onClose, true)
    }
  }, [onClose, active])
}
