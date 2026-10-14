import { Mic, Power } from 'lucide-react'
import { useState } from 'react'
import { useAudioInput } from '../audio/useInput'
import { Button, Meter, PageHeader } from '../components/ui'
import { useInstrument, useNoteName } from '../progress/settings'
import { stringNumber } from '../theory/instrument'
import { midiName, mod12 } from '../theory/notes'

export function TunerPage() {
  const [on, setOn] = useState(false)
  const { status, reading, level } = useAudioInput(on)
  const inst = useInstrument()
  const noteName = useNoteName()
  const cents = reading?.cents ?? 0
  const inTune = reading && Math.abs(cents) <= 5
  const nearest = reading ? Math.round(reading.midi) : null

  return (
    <div className="mx-auto max-w-xl px-4 pt-8">
      <PageHeader eyebrow="Entrada de áudio" title="Afinador">
        Também serve para testar a pedaleira: se a nota aparece aqui, os exercícios tocando vão funcionar.
      </PageHeader>

      <section className="panel p-6 text-center" aria-live="polite">
        <div className="font-display text-[7rem] leading-none font-black" style={{ color: inTune ? 'var(--color-led-green)' : undefined }}>
          {nearest !== null ? noteName(mod12(nearest)) : '—'}
        </div>
        <p className="font-mono text-sm text-pearl-faint mt-1">
          {reading ? `${midiName(nearest!)} · ${reading.freq.toFixed(1)} Hz` : on ? 'Toque uma corda' : 'Desligado'}
        </p>

        {/* agulha: LEDs em fila como um afinador de pedal */}
        <div className="mt-6 flex justify-center gap-1.5" aria-label={reading ? `${cents > 0 ? '+' : ''}${cents} cents` : undefined}>
          {Array.from({ length: 21 }, (_, i) => {
            const v = (i - 10) * 5
            const lit = reading && Math.abs(v - cents) <= 2.5
            const color = i === 10 ? 'text-led-green' : Math.abs(i - 10) <= 1 ? 'text-led-green' : 'text-led-red'
            return <span key={i} className={`${lit ? `led ${color}` : 'led-off'} ${i === 10 ? 'h-6' : 'h-4'} w-2 rounded-sm`} />
          })}
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-pearl-faint px-2">
          <span>grave</span>
          <span>afinado</span>
          <span>agudo</span>
        </div>

        <div className="mt-6">
          <Meter value={Math.min(1, level * 8)} tone="green" label="Nível de entrada" />
        </div>

        <Button size="lg" variant={on ? 'secondary' : 'primary'} className="mt-6 w-full" onClick={() => setOn(!on)}>
          {on ? <Power className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />} {on ? 'Desligar' : 'Ligar entrada'}
        </Button>
        {status === 'denied' && <p className="mt-3 text-led-red">O navegador bloqueou o microfone. Libere nas permissões do site.</p>}
        {status === 'error' && <p className="mt-3 text-led-red">Não foi possível abrir a entrada. Escolha outro dispositivo em Ajustes.</p>}
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Cordas soltas ({inst.tuning.name})</h2>
        <ul className="grid grid-cols-6 gap-2">
          {inst.openMidi.map((m, s) => (
            <li key={s} className={`panel p-2 text-center ${nearest === m ? 'border-led-green' : ''}`}>
              <span className="block font-display text-2xl font-black">{noteName(mod12(m))}</span>
              <span className="font-mono text-[10px] text-pearl-faint">{stringNumber(inst, s)}ª</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
