import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useI18n } from './i18n/useI18n'
import NavBar from './components/NavBar'
import GamePage from './pages/GamePage'
import CapturePage from './pages/CapturePage'
import ContactPage from './pages/ContactPage'

function App() {
  const { lang, setLang, t } = useI18n()

  const [storageAllowed, setStorageAllowed] = useState<boolean>(() => {
    const raw = localStorage.getItem('storageAllowed')
    return raw === null ? true : raw === 'true'
  })
  void setStorageAllowed

  useEffect(() => {
    localStorage.setItem('storageAllowed', String(storageAllowed))
    if (!storageAllowed) {
      localStorage.removeItem('solvableHistory')
      localStorage.removeItem('unsolvableHistory')
      localStorage.removeItem('lastViewedIndex')
      localStorage.removeItem('captureIngredients')
      localStorage.removeItem('captureTarget')
      localStorage.removeItem('captureGameOver')
    }
  }, [storageAllowed])

  return (
    <>
      <NavBar lang={lang} onChangeLang={setLang} t={t} />
      <Routes>
        <Route path="/" element={<GamePage storageAllowed={storageAllowed} setStorageAllowed={setStorageAllowed} />} />
        <Route path="/capture" element={<CapturePage storageAllowed={storageAllowed} />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </>
  )
}

export default App
