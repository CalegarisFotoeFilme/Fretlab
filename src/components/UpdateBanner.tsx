import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isDesktop } from '../library/desktop'
import { Button } from './ui'

type Update = Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>>

/**
 * App instalado (Windows): ao abrir, procura uma versão nova nos Releases do GitHub. Se houver,
 * oferece atualizar; o instalador assinado é baixado, instalado e o app reinicia.
 */
export function UpdateBanner() {
  const [update, setUpdate] = useState<Update>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!isDesktop()) return
    // sem internet ou sem versão para este sistema (ex.: Mac): fica quieto
    void import('@tauri-apps/plugin-updater')
      .then(({ check }) => check())
      .then(setUpdate)
      .catch(() => {})
  }, [])

  if (!update || hidden) return null

  const install = async () => {
    setError(null)
    setProgress(0)
    try {
      let total = 0
      let got = 0
      await update.downloadAndInstall((e) => {
        if (e.event === 'Started') total = e.data.contentLength ?? 0
        if (e.event === 'Progress') {
          got += e.data.chunkLength
          if (total) setProgress(Math.round((got / total) * 100))
        }
      })
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (e) {
      setProgress(null)
      setError(`Não deu para atualizar: ${String(e)}`)
    }
  }

  return (
    <div role="status" className="fixed bottom-4 right-4 z-50 w-[min(26rem,calc(100vw-2rem))] panel p-4 shadow-2xl grid gap-2">
      <div className="flex items-start gap-3">
        <Download className="size-5 text-enclosure shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">Nova versão do FretLab: {update.version}</p>
          <p className="text-sm text-pearl-dim">Sua biblioteca, progresso e ajustes continuam. O app reinicia sozinho no fim.</p>
        </div>
        {progress === null && (
          <button onClick={() => setHidden(true)} className="text-pearl-faint hover:text-pearl" aria-label="Depois">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {progress === null ? (
        <Button onClick={() => void install()}>Atualizar agora</Button>
      ) : (
        <div className="h-2 rounded-full bg-wood-950 overflow-hidden">
          <div className="h-full bg-enclosure transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-sm text-led-red">{error}</p>}
    </div>
  )
}
