'use client'
import { useEffect, useRef, type FC, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Orchestrates the language-change animation:
 *   • Text fade-out/in   — CSS rules on html[data-lang-fade] (globals.css)
 *   • Width/height resize — explicit JS rAF loop (writes el.style[prop] each frame)
 *
 * WHY rAF loop instead of WAAPI or CSS transitions:
 *   All data-lang-resize="height" elements have overflow:hidden. On iOS WebKit,
 *   WAAPI height animations on overflow:hidden elements are sometimes shortcircuited
 *   — especially when the element's inline style value equals the animation toValue
 *   (which happened because we set el.style.height = dims.h before calling animate()).
 *   CSS transitions fail because there is no committed paint between setting the
 *   transition property and the value change when text is transparent.
 *   A plain rAF loop writes el.style[prop] every frame, bypassing all these quirks.
 *
 * Elements opt in via data-lang-resize:
 *   data-lang-resize=""        → animate width  (default)
 *   data-lang-resize="width"   → animate width
 *   data-lang-resize="height"  → animate height
 *   data-lang-resize="both"    → animate both
 *
 * Elements with w-full are skipped for width (container-driven width).
 */

type ResizeMode = 'width' | 'height' | 'both'

interface StopFn {
  (): void
}

interface LockedEl {
  el: HTMLElement
  mode: ResizeMode
  prevW: number
  prevH: number
  stops: StopFn[]
}

// Cubic ease-out — starts at full speed, decelerates smoothly into the target.
// Feels more natural than ease-in-out for layout resizes: no sluggish ramp-up.
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Animate a single layout property (width or height) via a rAF loop.
 * Returns a stop function that cancels the animation (element stays at
 * whatever intermediate value it was at — caller must clean up if needed).
 */
function animateProp(
  el: HTMLElement,
  prop: 'width' | 'height',
  from: number,
  to: number,
  duration: number,
): StopFn {
  const start = performance.now()
  let rafId = 0
  let stopped = false

  function step(now: number) {
    if (stopped) return
    const t = Math.min((now - start) / duration, 1)
    el.style[prop] = `${from + (to - from) * easeOut(t)}px`
    if (t < 1) rafId = requestAnimationFrame(step)
  }

  rafId = requestAnimationFrame(step)
  return () => {
    stopped = true
    cancelAnimationFrame(rafId)
  }
}

const LanguageTransitionWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation()
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lockedElsRef = useRef<LockedEl[]>([])
  // Track previous language so the useEffect only fires on actual changes.
  const prevLangRef = useRef(i18n.language)

  function cleanup() {
    clearTimeout(fadeTimerRef.current)
    lockedElsRef.current.forEach(({ el, stops }) => {
      stops.forEach(s => s())
      el.style.width = ''
      el.style.height = ''
      el.style.visibility = ''
    })
    lockedElsRef.current = []
  }

  // ── Phase A: snapshot BEFORE changeLanguage() ────────────────────────────
  // localechange-before fires synchronously before changeLanguage() is called,
  // so we capture old element sizes while text is still the old language.
  useEffect(() => {
    const root = document.documentElement

    const handleBeforeLocaleChange = () => {
      cleanup()
      root.dataset.langFade = 'out'

      document.querySelectorAll<HTMLElement>('[data-lang-resize]').forEach((el) => {
        // Skip elements inside containers that opt out of the animation.
        if (el.closest('[data-lang-resize-ignore]')) return

        const attr = el.getAttribute('data-lang-resize') ?? ''
        let mode: ResizeMode = 'width'
        if (attr === 'height') mode = 'height'
        else if (attr === 'both') mode = 'both'

        const rect = el.getBoundingClientRect()
        // Skip width animation only when the element actually fills its container
        // at runtime (container-driven width → old and new widths are equal anyway).
        // A class-name check like `w-full` is unreliable for responsive classes
        // such as `w-full tablet:w-auto` — use a layout-ratio check instead.
        const parentW = el.parentElement?.getBoundingClientRect().width ?? Infinity
        const doWidth = (mode === 'width' || mode === 'both') && rect.width < parentW * 0.98
        const doHeight = mode === 'height' || mode === 'both'
        if (!doWidth && !doHeight) return
        if (doWidth) el.style.width = `${rect.width}px`
        if (doHeight) el.style.height = `${rect.height}px`

        lockedElsRef.current.push({
          el,
          mode: doWidth ? mode : 'height',
          prevW: rect.width,
          prevH: rect.height,
          stops: [],
        })
      })
    }

    window.addEventListener('localechange-before', handleBeforeLocaleChange)
    return () => {
      window.removeEventListener('localechange-before', handleBeforeLocaleChange)
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Phase B: measure + animate AFTER React commits new strings ────────────
  // useEffect([i18n.language]) is the ONLY reliable signal that React has
  // committed the DOM with new translations. rAF-based waits after the
  // changeLanguage() promise are not reliable — React 18 concurrent rendering
  // can commit in a later frame. Here, React guarantees the DOM is updated
  // before this effect runs.
  useEffect(() => {
    if (i18n.language === prevLangRef.current) return
    prevLangRef.current = i18n.language

    const root = document.documentElement
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const dur = isTouchDevice ? 220 : 500

    // If there are no resize elements, still transition the fade state so text
    // becomes visible again. (data-lang-fade='out' was set in Phase A regardless.)
    if (lockedElsRef.current.length === 0) {
      root.dataset.langFade = 'in'
      fadeTimerRef.current = setTimeout(() => {
        delete root.dataset.langFade
      }, dur + 100)
      return
    }

    const entries = lockedElsRef.current.filter(({ el }) => document.contains(el))

    // Measure new natural size: hide, release to auto, single forced reflow, read, snap back.
    entries.forEach(({ el, mode }) => {
      el.style.visibility = 'hidden'
      if (mode === 'width' || mode === 'both') el.style.width = 'auto'
      if (mode === 'height' || mode === 'both') el.style.height = 'auto'
    })
    void document.body.offsetWidth // single forced reflow

    const newDims = new Map<HTMLElement, { w: number; h: number }>()
    entries.forEach(({ el }) => {
      const r = el.getBoundingClientRect()
      newDims.set(el, { w: r.width, h: r.height })
    })

    // Restore old dimensions — prevents a visible jump before the animation starts.
    entries.forEach(({ el, mode, prevW, prevH }) => {
      if (mode === 'width' || mode === 'both') el.style.width = `${prevW}px`
      if (mode === 'height' || mode === 'both') el.style.height = `${prevH}px`
      el.style.visibility = ''
    })

    // Activate fade-in (CSS color transition) + launch rAF resize loops.
    root.dataset.langFade = 'in'

    entries.forEach((entry) => {
      const { el, mode, prevW, prevH } = entry
      const dims = newDims.get(el)
      if (!dims) return

      if ((mode === 'width' || mode === 'both') && Math.abs(dims.w - prevW) > 0.5)
        entry.stops.push(animateProp(el, 'width', prevW, dims.w, dur))
      if ((mode === 'height' || mode === 'both') && Math.abs(dims.h - prevH) > 0.5)
        entry.stops.push(animateProp(el, 'height', prevH, dims.h, dur))
    })

    fadeTimerRef.current = setTimeout(() => {
      delete root.dataset.langFade
      lockedElsRef.current.forEach(({ el, stops }) => {
        if (!document.contains(el)) return
        stops.forEach(s => s())
        el.style.width = ''
        el.style.height = ''
        el.style.visibility = ''
      })
      lockedElsRef.current = []
    }, dur + 100)
  // i18n.language is the only dependency — this effect IS the language-change handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  return <>{children}</>
}

export default LanguageTransitionWrapper
