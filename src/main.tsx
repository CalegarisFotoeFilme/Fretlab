import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router'
import './design/tokens.css'
import { AppShell } from './components/AppShell'
import { TrailPage } from './pages/TrailPage'
import { LessonPage } from './pages/LessonPage'
import { TrainingPage } from './pages/TrainingPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { TunerPage } from './pages/TunerPage'
import { LibraryPage } from './pages/LibraryPage'
import { SongPage } from './pages/SongPage'
import { SettingsPage } from './pages/SettingsPage'
import { isDesktop } from './library/desktop'

// Modo offline (service worker) só no navegador. No app para Mac os arquivos já são locais, e o
// cache fazia a primeira abertura depois de atualizar mostrar a versão anterior.
if (import.meta.env.MODE !== 'artifact' && 'serviceWorker' in navigator) {
  if (isDesktop()) {
    void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()))
    if ('caches' in window) void caches.keys().then((ks) => ks.forEach((k) => void caches.delete(k)))
  } else if (import.meta.env.PROD) {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
  }
}

// Na página do claude.ai a URL não pode mudar: as rotas ficam em memória.
const createRouter = import.meta.env.MODE === 'artifact' ? createMemoryRouter : createBrowserRouter
const router = createRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <TrailPage /> },
      { path: '/licao/:id', element: <LessonPage /> },
      { path: '/treino', element: <TrainingPage /> },
      { path: '/braco', element: <ExplorerPage /> },
      { path: '/afinador', element: <TunerPage /> },
      { path: '/musicas', element: <LibraryPage /> },
      { path: '/musicas/:id', element: <SongPage /> },
      { path: '/ajustes', element: <SettingsPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
