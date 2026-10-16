import { CloudDownload, Square } from 'lucide-react'
import { Button } from '../components/ui'
import { DAILY_LIMIT, dailyLeft, startBulkImport, stopBulkImport, useBulkImport } from './bulkImport'

/** Botão de "Importar meus favoritos do Songsterr" (app para Mac). */
export function BulkImportButton() {
  const status = useBulkImport((s) => s.status)
  const busy = status === 'listing' || status === 'running'
  return (
    <Button variant="secondary" onClick={() => void startBulkImport()} disabled={busy}>
      <CloudDownload className="size-4" aria-hidden /> Importar meus favoritos
    </Button>
  )
}

/** Progresso da importação dos favoritos. */
export function BulkImportPanel() {
  const s = useBulkImport()
  if (s.status === 'idle') return null
  const busy = s.status === 'listing' || s.status === 'running'
  const total = s.songs.length
  const done = s.imported + s.skipped + s.failed.length
  return (
    <section className="panel p-4 mb-6 grid gap-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <CloudDownload className="size-5 text-enclosure" aria-hidden />
        <p className="font-semibold flex-1">
          {s.status === 'listing' && 'Lendo seus favoritos no Songsterr…'}
          {s.status === 'running' && `Importando favoritos: ${done} de ${total}`}
          {s.status === 'done' && `Pronto: ${s.imported} importadas, ${s.skipped} já estavam na biblioteca${s.failed.length ? `, ${s.failed.length} com problema` : ''}.`}
          {s.status === 'stopped' && `Interrompido: ${s.imported} importadas, ${s.skipped} já estavam aqui.`}
          {s.status === 'error' && 'Não deu para importar.'}
        </p>
        {busy && (
          <Button variant="ghost" onClick={stopBulkImport}>
            <Square className="size-4" aria-hidden /> Parar
          </Button>
        )}
      </div>
      {total > 0 && (
        <div className="h-2 rounded-full bg-wood-950 overflow-hidden">
          <div className="h-full bg-enclosure transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}
      {s.current && busy && (
        <p className="text-sm text-pearl-dim">
          Agora: <span className="text-pearl">{s.current.title}</span>
          {s.current.artist ? ` · ${s.current.artist}` : ''}. Cada música entra com o Guitar Pro e a sincronia do YouTube já salva.
        </p>
      )}
      {s.message && <p className="text-sm text-pearl-dim">{s.message}</p>}
      {s.failed.length > 0 && (
        <details className="text-sm text-pearl-dim">
          <summary className="cursor-pointer">Músicas com problema ({s.failed.length})</summary>
          <ul className="mt-1 list-disc pl-5">
            {s.failed.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </details>
      )}
      {busy && (
        <p className="text-xs text-pearl-faint">
          Deixe a janela do Songsterr aberta. Uma música por vez, com pausa entre elas. O Songsterr permite 200 downloads por dia: a importação para em {DAILY_LIMIT} (ainda cabem {dailyLeft()} hoje) e continua amanhã de onde parou.
        </p>
      )}
    </section>
  )
}
