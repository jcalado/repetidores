'use client'

import { useEffect } from 'react'

export default function RedirectClient({ newUrl }: { newUrl: string }) {
  useEffect(() => {
    window.location.replace(newUrl)
  }, [newUrl])
  return null
}
