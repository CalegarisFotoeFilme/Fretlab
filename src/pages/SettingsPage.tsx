import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Music, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listInputDevices, type InputDevice } from '../audio/engine'
import { Button, PageHeader, Segmented } from '../components/ui'
import { db } from '../progress/db'
import { isDesktop, saveBackupDesktop } from '../library/desktop'
import { exportLibrary, exportProgress, importBackup } from '../progress/progress'
import { useSettings, type NoteNaming } from '../progress/settings'
import { INSTRUMENT_LABEL, TUNINGS, type InstrumentKind } from '../theory/instrument'

export function SettingsPage() {
  const s = useSettings()
  const [devices, setDevices] = useState<InputDevice[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const soundFont = useLiveQuery(() => db.assets.get('soundfont'))
  const [sfMsg, setSfMsg] = useState<string | null>(null)

  /** Confere o cabeçalho RIFF/sfbk antes de guardar (um arquivo errado deixaria o player mudo). */
  const loadSoundFont = async (file: File) => {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const tag = (a: number, b: number) => String.fromCharCode(...head.slice(a, b))
    if (tag(0, 4) !== 'RIFF' || tag(8, 12) !== 'sfbk') {
      setSfMsg('Esse arquivo não é um SoundFont (.sf2/.sf3).')
      return
    }
    await db.assets.put({ id: 'soundfont', name: file.name, data: file, addedAt: Date.now() })
    setSfMsg(`Pronto: ${file.name} será usado nas músicas (reabra a música, se estiver aberta).`)
  }

  const refreshDevices = async (ask = false) => {
    try {
      if (ask) (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((t) => t.stop())
      setDevices(await listInputDevices())
    } catch {
      setMsg('Sem permissão para listar as entradas de áudio.')
    }
  }
  useEffect(() => {
    listInputDevices().then(setDevices, () => {})
  }, [])

  const doExport = async (kind: 'progresso' | 'biblioteca') => {
    setMsg(kind === 'biblioteca' ? 'Preparando o backup da biblioteca…' : '')
    const json = kind === 'biblioteca' ? await exportLibrary() : await exportProgress()
    const name = `fretlab-${kind}-${new Date().toISOString().slice(0, 10)}.json`
    if (isDesktop()) {
      try {
        setMsg(`Backup salvo em ${await saveBackupDesktop(name, json)}`)
      } catch (e) {
        setMsg(`Não foi possível salvar o backup: ${e}`)
      }
      return
    }
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('')
  }

  const doImport = async (file: File) => {
    try {
      const done = await importBackup(await file.text())
      setMsg(done.length ? `Importado: ${done.join(' e ')}.` : 'Esse backup não tinha nada para importar.')
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-10 pt-8">
      <PageHeader eyebrow="Configuração" title="Ajustes" />

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Field label="Instrumento" hint="Tudo no app (braço, exercícios, afinador) segue essa escolha.">
          <Segmented<InstrumentKind>
            label="Instrumento"
            value={s.instrument}
            onChange={(v) => s.set({ instrument: v, tuningId: 'std' })}
            options={(Object.keys(INSTRUMENT_LABEL) as InstrumentKind[]).map((k) => ({ value: k, label: INSTRUMENT_LABEL[k] }))}
          />
        </Field>

        <Field label="Afinação">
          <select value={s.tuningId} onChange={(e) => s.set({ tuningId: e.target.value })} className="min-h-11 w-full rounded-xl bg-wood-950 border border-wood-700 px-3">
            {TUNINGS[s.instrument].map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>

        <Field label="Mão">
          <Segmented label="Mão" value={s.leftHanded ? 'l' : 'r'} onChange={(v) => s.set({ leftHanded: v === 'l' })} options={[
            { value: 'r', label: 'Destro' }, { value: 'l', label: 'Canhoto' },
          ]} />
        </Field>

        <Field label="Nome das notas">
          <Segmented<NoteNaming> label="Nome das notas" value={s.naming} onChange={(v) => s.set({ naming: v })} options={[
            { value: 'letters', label: 'Cifra (C D E)' }, { value: 'solfege', label: 'Dó Ré Mi' },
          ]} />
        </Field>

        <Field label="Entrada de áudio" hint="Ligue a pedaleira por USB e escolha-a aqui. Se a lista vier sem nomes, toque em Atualizar para liberar o acesso.">
          <div className="flex gap-2">
            <select
              value={s.inputDeviceId ?? ''}
              onChange={(e) => s.set({ inputDeviceId: e.target.value || null })}
              className="min-h-11 flex-1 min-w-0 rounded-xl bg-wood-950 border border-wood-700 px-3"
              aria-label="Dispositivo de entrada"
            >
              <option value="">Padrão do sistema</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <Button variant="secondary" onClick={() => refreshDevices(true)}>
              <RefreshCw className="size-4" aria-hidden /> Atualizar
            </Button>
          </div>
        </Field>

        <Field label="Plugins e pedaleiras (Neural DSP, Zoom, Pocket Master)">
          <p className="text-sm text-pearl/90">
            Pode tocar com os seus plugins abertos: no macOS a entrada de áudio é compartilhada, e o FretLab ouve o sinal que a pedaleira manda pelo USB ao mesmo tempo que o plugin (ele não ouve a saída do plugin).
          </p>
          <p className="mt-2 text-sm text-pearl-faint">
            Para os exercícios, um patch limpo ou com pouco ganho detecta melhor: distorção e delay embaralham a altura da nota. Se a pedaleira manda estéreo, tanto faz o lado.
          </p>
        </Field>

        <Field label={`Sensibilidade: ${Math.round((0.05 - s.sensitivity) / 0.0005)}%`} hint="Aumente se as notas não forem detectadas. Diminua se ruído virar nota.">
          <input type="range" min={0.002} max={0.05} step={0.001} value={0.052 - s.sensitivity} onChange={(e) => s.set({ sensitivity: 0.052 - Number(e.target.value) })} className="w-full accent-[var(--color-enclosure)]" aria-label="Sensibilidade" />
        </Field>

        <Field label={`Compensação de atraso: ${s.latencyMs} ms`} hint="Se nos exercícios de ritmo seus acertos aparecem sempre atrasados, aumente até ficarem no centro.">
          <input type="range" min={0} max={250} step={5} value={s.latencyMs} onChange={(e) => s.set({ latencyMs: Number(e.target.value) })} className="w-full accent-[var(--color-enclosure)]" aria-label="Compensação de atraso" />
        </Field>

        <Field
          label="Timbres do player (SoundFont)"
          hint="O padrão (Sonivox, 1,3 MB) é leve, mas simples. Um SoundFont maior soa bem mais real: o GeneralUser GS (gratuito, ~30 MB) é uma ótima escolha. Fica guardado só neste navegador/app."
        >
          <p className="flex items-center gap-2 text-sm">
            <Music className="size-4 text-pearl-dim" aria-hidden />
            {soundFont ? (
              <span>
                <span className="font-semibold">{soundFont.name}</span> <span className="text-pearl-faint">({(soundFont.data.size / 1048576).toFixed(1)} MB)</span>
              </span>
            ) : (
              <span className="text-pearl-dim">Padrão (Sonivox)</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-wood-800 border border-wood-600/60 font-semibold cursor-pointer hover:bg-wood-700">
              <Upload className="size-4" aria-hidden /> Carregar .sf2 / .sf3
              <input type="file" accept=".sf2,.sf3" className="sr-only" onChange={(e) => e.target.files?.[0] && void loadSoundFont(e.target.files[0])} />
            </label>
            {soundFont && (
              <Button variant="ghost" onClick={() => void db.assets.delete('soundfont').then(() => setSfMsg('Voltou ao SoundFont padrão.'))}>
                <Trash2 className="size-4" aria-hidden /> Voltar ao padrão
              </Button>
            )}
          </div>
          {sfMsg && <p role="status" className="mt-2 text-sm text-pearl-dim">{sfMsg}</p>}
        </Field>

        <BackupField label="Backup dos estudos" hint="Lições, estrelas, sequência de dias e o treino. Exporte para guardar ou continuar em outro aparelho." onExport={() => doExport('progresso')} onImport={doImport} />
        <BackupField label="Backup da biblioteca" hint="Todas as músicas: os arquivos das tabs, a sincronia com o YouTube e os volumes. Importar não duplica músicas que já estão aqui." onExport={() => doExport('biblioteca')} onImport={doImport} />
        {msg && <p role="status" className="text-pearl-dim">{msg}</p>}
      </div>
    </div>
  )
}

function BackupField({ label, hint, onExport, onImport }: { label: string; hint: string; onExport: () => void; onImport: (f: File) => void }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onExport}>
          <Download className="size-4" aria-hidden /> Exportar
        </Button>
        <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-wood-800 border border-wood-600/60 font-semibold cursor-pointer hover:bg-wood-700">
          <Upload className="size-4" aria-hidden /> Importar
          <input type="file" accept="application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </label>
      </div>
    </Field>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <p className="font-semibold mb-2">{label}</p>
      {children}
      {hint && <p className="mt-2 text-sm text-pearl-faint">{hint}</p>}
    </div>
  )
}
