import { useI18n } from '../i18n/useI18n'

export default function GlobalStorageControls({
  storageAllowed,
  setStorageAllowed,
}: {
  storageAllowed: boolean
  setStorageAllowed: (val: boolean) => void
}) {
  const { t } = useI18n()

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
