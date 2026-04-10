'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function GlobalStorageControls({
  dict,
}: {
  dict: Record<string, string>
}) {
  const [storageAllowed, setStorageAllowedState] = useState<boolean>(true)
  const pathname = usePathname()

  useEffect(() => {
    const raw = localStorage.getItem('storageAllowed')
    if (raw !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageAllowedState(raw === 'true')
    }
  }, [])

  const setStorageAllowed = (val: boolean) => {
    setStorageAllowedState(val)
    localStorage.setItem('storageAllowed', String(val))
    if (!val) {
      localStorage.removeItem('solvableHistory')
      localStorage.removeItem('unsolvableHistory')
      localStorage.removeItem('lastViewedIndex')
      localStorage.removeItem('captureIngredients')
      localStorage.removeItem('captureTarget')
      localStorage.removeItem('captureGameOver')
    }
    window.dispatchEvent(new Event('storage-allowed-changed'))
  }

  const t = (key: string) => dict[key] ?? key

  const clearAllHistory = () => {
    if (!confirm(t('msg_del_confirm'))) return

    // Clear Game History
    localStorage.removeItem('solvableHistory')
    localStorage.removeItem('unsolvableHistory')
    localStorage.removeItem('lastViewedIndex')
    
    // Clear Capture History
    localStorage.removeItem('captureIngredients')
    localStorage.removeItem('captureTarget')
    localStorage.removeItem('captureGameOver')

    // Clear Algebra History
    localStorage.removeItem('algebraActiveTab')
    localStorage.removeItem('algebra_solved_addsub')
    localStorage.removeItem('algebra_solved_muldiv')
    localStorage.removeItem('algebra_solved_twostep')

    window.dispatchEvent(new Event('clear-history'))
  }

  // Prevent hydration mismatch by returning null on first server render if needed,
  // but since we initialize to true, it might mismatch the checkbox if user set to false.
  // Using a hydration trick:
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  // Don't show on login or auth pages
  if (pathname === '/login' || pathname?.startsWith('/auth')) {
    return null
  }

  if (!mounted) return null

  return (
    <div className="global-controls">
      <label className="storage-label">
        <input
          type="checkbox"
          id="storage-toggle"
          checked={storageAllowed}
          onChange={(e) => setStorageAllowed(e.target.checked)}
        />
        <span>{t('chk_remember')}</span>
      </label>
      <button className="btn-clear-minimal" onClick={clearAllHistory}>
        {t('btn_clear_hist')}
      </button>
    </div>
  )
}
