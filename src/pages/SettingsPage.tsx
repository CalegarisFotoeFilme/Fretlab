import { Download, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listInputDevices, type InputDevice } from '../audio/engine'
import { Button, PageHeader, Segmented } from '../components/ui'
import { exportProgress, importProgress } from '../progress/progress'
import { useSettings, type NoteNaming } from '../progress/settings'
import { INSTRUMENT_LABEL, TUNINGS, type InstrumentKind } from '../theory/instrument'

export function SettingsPage() {
  const s = useSettings()
  const [devices, setDevices] = useState<InputDevice[]>([])
  const [msg, setMsg] = useState<string | null>(null)

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

  const doExport = async () => {
    const blob = new Blob([await exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fretlab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (file: File) => {
    try {
      await importProgress(await file.text())
      setMsg('Progresso importado.')
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

        <Field label={`Sensibilidade: ${Math.round((0.05 - s.sensitivity) / 0.0005)}%`} hint="Aumente se as notas não forem detectadas. Diminua se ruído virar nota.">
          <input type="range" min={0.002} max={0.05} step={0.001} value={0.052 - s.sensitivity} onChange={(e) => s.set({ sensitivity: 0.052 - Number(e.target.value) })} className="w-full accent-[var(--color-enclosure)]" aria-label="Sensibilidade" />
        </Field>

        <Field label={`Compensação de atraso: ${s.latencyMs} ms`} hint="Se nos exercícios de ritmo seus acertos aparecem sempre atrasados, aumente até ficarem no centro.">
          <input type="range" min={0} max={250} step={5} value={s.latencyMs} onChange={(e) => s.set({ latencyMs: Number(e.target.value) })} className="w-full accent-[var(--color-enclosure)]" aria-label="Compensação de atraso" />
        </Field>

        <Field label="Backup do progresso" hint="O progresso fica salvo só neste navegador. Exporte para levar a outro aparelho.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={doExport}>
              <Download className="size-4" aria-hidden /> Exportar
            </Button>
            <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-wood-800 border border-wood-600/60 font-semibold cursor-pointer hover:bg-wood-700">
              <Upload className="size-4" aria-hidden /> Importar
              <input type="file" accept="application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
            </label>
          </div>
        </Field>
        {msg && <p role="status" className="text-pearl-dim">{msg}</p>}
      </div>
    </div>
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
