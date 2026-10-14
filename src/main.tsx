import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './design/tokens.css'
import { AppShell } from './components/AppShell'
import { TrailPage } from './pages/TrailPage'
import { LessonPage } from './pages/LessonPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { TunerPage } from './pages/TunerPage'
import { LibraryPage } from './pages/LibraryPage'
import { SongPage } from './pages/SongPage'
import { SettingsPage } from './pages/SettingsPage'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <TrailPage /> },
      { path: '/licao/:id', element: <LessonPage /> },
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
