'use client'

import { useEffect } from 'react'

type RedirectClientProps = {
  href: string
}

export default function RedirectClient({ href }: RedirectClientProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(href)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [href])

  return null
}
