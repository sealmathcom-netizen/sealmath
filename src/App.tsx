import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useI18n } from './i18n/useI18n'
import NavBar from './components/NavBar'
import GamePage from './pages/GamePage'
import HomePage from './pages/HomePage'
import CapturePage from './pages/CapturePage'
import ContactPage from './pages/ContactPage'
import AlgebraPage from './pages/AlgebraPage'
import GlobalStorageControls from './components/GlobalStorageControls'

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
      <GlobalStorageControls storageAllowed={storageAllowed} setStorageAllowed={setStorageAllowed} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/24-challenge" element={<GamePage storageAllowed={storageAllowed} />} />
        <Route path="/capture" element={<CapturePage storageAllowed={storageAllowed} />} />
        <Route path="/algebra" element={<AlgebraPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </>
  )
}

export default App
