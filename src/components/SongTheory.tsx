import type * as AT from '@coderline/alphatab'
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { playSequence } from '../audio/engine'
import type { SongAnalysis, SongNote, BarChord } from '../library/songAnalysis'
import { useNoteName, useSettings } from '../progress/settings'
import { fittingScales, functionOf, restingNote, type Key } from '../theory/analysis'
import { findPositions, type Instrument } from '../theory/instrument'
import { CHORDS, SCALES, chordName, chordNotes, harmonicField, intervalBetween, mod12, prefersFlats, scaleNotes, type ScaleId } from '../theory/notes'
import { Fretboard, type Marker } from './Fretboard'
import { Kbd } from './useHotkeys'
import { Segmented } from './ui'

// Papel de uma nota dentro do acorde (pelo intervalo até a fundamental).
const ROLE: Record<string, string> = {
  '1': 'fundamental',
  b2: 'b9 (tensão)',
  '2': '9ª (tensão)',
  b3: 'terça menor',
  '3': 'terça maior',
  '4': '4ª / 11ª',
  b5: 'quinta diminuta',
  '5': 'quinta',
  b6: 'b13 (tensão)',
  '6': '6ª / 13ª',
  b7: 'sétima menor',
  '7': 'sétima maior',
}
const FN_SHORT = { tônica: 'T', subdominante: 'S', dominante: 'D' } as const

/** Toca um acorde como arpejo rápido, a partir da fundamental. */
const hearChord = (c: { root: number; quality: BarChord['quality'] }) => {
  const base = 48 + c.root
  playSequence(chordNotes(c.root, c.quality).map((pc) => base + mod12(pc - c.root)), 0.1)
}

interface Props {
  analysis: SongAnalysis
  score: AT.model.Score
  track: AT.model.Track | null
  bar: number
  onBar: (i: number) => void
  inst: Instrument
}

export function SongTheory({ analysis, score, track, bar, onBar, inst }: Props) {
  const noteName = useNoteName()
  const { key, second } = analysis
  const k: Key = { root: key.root, mode: key.mode }
  const flats = prefersFlats(key.root, key.mode)
  const keyLabel = (g: Key) => `${noteName(g.root, prefersFlats(g.root, g.mode))} ${g.mode === 'major' ? 'maior' : 'menor'}`
  const field = harmonicField(key.root, key.mode)
  const used = new Map(analysis.usage.map((u) => [u.chord.name, u.bars]))
  const outside = analysis.usage.filter((u) => !u.chord.diatonic).slice(0, 6)
  const prog = analysis.progression

  // graus mais tocados pela faixa escolhida (peso = duração)
  const degrees = useMemo(() => {
    const h = new Array(12).fill(0)
    for (const n of analysis.notes) if (!track || n.track === track.index) h[mod12(n.midi - key.root)] += n.dur
    const total = h.reduce((s, v) => s + v, 0) || 1
    const scale = scaleNotes(0, key.mode)
    return h
      .map((w, iv) => ({ iv, share: w / total, inScale: scale.includes(iv) }))
      .filter((d) => d.share >= 0.01)
      .sort((a, b) => b.share - a.share)
  }, [analysis, track, key.root, key.mode])

  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-4">
        <h2 className="eyebrow">Teoria desta música</h2>
        <p className="mt-2 font-display text-4xl font-black uppercase">{keyLabel(key)}</p>
        <p className="text-sm text-pearl-dim">Tom provável, calculado pelas notas da música. Segunda opção: {keyLabel(second)}.</p>

        <h3 className="mt-4 text-sm font-semibold">Graus mais tocados {track && <span className="text-pearl-faint font-normal">· {track.name}</span>}</h3>
        <p className="text-xs text-pearl-faint">Cada nota contada como distância até a tônica ({noteName(key.root, flats)} = 1). Em âmbar, notas fora da escala.</p>
        <ul className="mt-2 grid gap-1">
          {degrees.slice(0, 8).map((d) => (
            <li key={d.iv} className="grid grid-cols-[3.5rem_2rem_1fr_2.5rem] items-center gap-2 text-sm">
              <span className={`font-mono font-bold ${d.inScale ? 'text-pearl' : 'text-led-amber'}`}>{INTERVAL_SHORT(d.iv)}</span>
              <span className="font-semibold">{noteName(mod12(key.root + d.iv), flats)}</span>
              <span className="h-2 rounded-full bg-wood-800 overflow-hidden">
                <span className={`block h-full rounded-full ${d.inScale ? 'bg-enclosure' : 'bg-led-amber'}`} style={{ width: `${Math.round(d.share * 100)}%` }} />
              </span>
              <span className="text-right font-mono text-xs text-pearl-faint">{Math.round(d.share * 100)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-4">
        <h2 className="eyebrow">Campo harmônico</h2>
        <p className="mt-1 text-xs text-pearl-faint">Os acordes do tom. Acesos: os que aparecem na música, com quantos compassos. Clique para ouvir.</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {field.map((d) => {
            const name = chordName(d.root, d.quality, flats)
            // conta também as variações (G5, G7M…) do mesmo grau
            const bars = analysis.usage.filter((u) => u.chord.root === d.root && u.chord.diatonic).reduce((s, u) => s + u.bars, 0)
            return (
              <button
                key={d.degree}
                onClick={() => hearChord(d)}
                className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${bars ? 'border-enclosure/60 bg-enclosure/10' : 'border-wood-700 opacity-60'} hover:bg-wood-800`}
                title={`Ouvir ${name}`}
              >
                <span className="flex justify-between font-mono text-[10px] text-pearl-faint">
                  {d.roman} <span>{FN_SHORT[functionOf(d.root, k)!]}</span>
                </span>
                <span className="font-display text-xl font-black">{name}</span>
                <span className="block font-mono text-[10px] text-pearl-faint">{bars ? `${bars} comp.` : '—'}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-pearl-faint">T = tônica (repouso) · S = subdominante (afasta) · D = dominante (tensão, pede volta à tônica)</p>
        {outside.length > 0 && (
          <>
            <h3 className="mt-3 text-sm font-semibold">Fora do campo</h3>
            <p className="text-xs text-pearl-faint">Acordes emprestados de outro tom ou com notas cromáticas.</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {outside.map((u) => (
                <button key={u.chord.name} onClick={() => hearChord(u.chord)} className="rounded-lg border border-led-amber/50 px-2 py-1 text-left hover:bg-wood-800">
                  <span className="font-mono text-[10px] text-led-amber">{u.chord.roman}</span> <span className="font-display font-black">{u.chord.name}</span>{' '}
                  <span className="font-mono text-[10px] text-pearl-faint">{u.bars}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {used.size === 0 && <p className="mt-2 text-sm text-pearl-dim">Não deu para identificar acordes nesta música.</p>}
      </section>

      {prog && (
        <section className="panel p-4">
          <h2 className="eyebrow">Progressão principal</h2>
          <p className="mt-1 text-xs text-pearl-faint">
            A sequência de {prog.length} compassos que mais se repete: {prog.count} vezes, a partir do compasso {prog.start + 1}.
          </p>
          <div className="mt-2 flex flex-wrap items-stretch gap-1.5">
            {analysis.chords.slice(prog.start, prog.start + prog.length).map((cs, i) => (
              <button key={i} onClick={() => onBar(prog.start + i)} className="rounded-lg border border-wood-700 px-2.5 py-1.5 text-left hover:bg-wood-800" title={`Ir para o compasso ${prog.start + i + 1}`}>
                <span className="block font-mono text-[10px] text-pearl-faint">{cs.map((c) => c.roman).join(' ')}</span>
                <span className="font-display text-xl font-black">{cs.map((c) => c.name).join(' ')}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <BarDetail analysis={analysis} score={score} track={track} bar={bar} onBar={onBar} inst={inst} k={k} flats={flats} />
    </div>
  )
}

const INTERVAL_SHORT = (iv: number) => intervalBetween(0, iv).short

function BarDetail({ analysis, score, track, bar, onBar, inst, k, flats }: Props & { k: Key; flats: boolean }) {
  const noteName = useNoteName()
  const leftHanded = useSettings((s) => s.leftHanded)
  const chords = analysis.chords[bar] ?? []
  const all = analysis.byBar[bar] ?? []
  const mine = all.filter((n) => !track || n.track === track.index)
  const played = mine.filter((n) => n.onset).sort((a, b) => a.pos - b.pos || a.midi - b.midi)
  const rest = restingNote(played.map((n) => ({ ...n })))
  const chordAt = (pos: number) => chords[Math.min(chords.length - 1, Math.floor(pos * chords.length))]
  const main = chords[0]

  // notas da faixa no compasso + as notas do(s) acorde(s), com peso menor: a escala tem que servir para os dois
  const barHist = new Array(12).fill(0)
  for (const n of mine) barHist[mod12(n.midi)] += n.dur
  const chordWeight = Math.max(1, barHist.reduce((s, v) => s + v, 0) * 0.1)
  for (const c of chords) for (const pc of chordNotes(c.root, c.quality)) barHist[pc] += chordWeight
  const scales = fittingScales(barHist, [...(main ? [main.root] : []), k.root], scaleNotes(k.root, k.mode)).slice(0, 4)
  const [pick, setPick] = useState(0)
  const scale = scales[Math.min(pick, scales.length - 1)]

  // marcadores: notas do compasso nas casas da tab (se a afinação bater com a do instrumento) + escala em volta
  const markers: Marker[] = []
  {
    const out = markers
    const staffTuning = track?.staves[0]?.stringTuning.tunings ?? []
    const sameTuning = staffTuning.length === inst.openMidi.length && [...staffTuning].reverse().every((m, i) => m === inst.openMidi[i])
    const seen = new Set<string>()
    let lo = 24
    let hi = 0
    for (const n of mine) {
      const positions = sameTuning ? [{ string: n.string - 1, fret: n.fret }] : findPositions(inst, mod12(n.midi), 15).slice(0, 2)
      for (const p of positions) {
        const id = `${p.string}:${p.fret}`
        if (seen.has(id)) continue
        seen.add(id)
        lo = Math.min(lo, p.fret)
        hi = Math.max(hi, p.fret)
        const root = main ? mod12(n.midi) === main.root : false
        out.push({ ...p, tone: root ? 'root' : 'neutral', label: main ? intervalBetween(main.root, mod12(n.midi)).short : noteName(mod12(n.midi), flats) })
      }
    }
    if (scale) {
      const from = Math.max(0, (out.length ? lo : 0) - 2)
      const to = out.length ? hi + 2 : 12
      for (const pc of scaleNotes(scale.root, scale.scale))
        for (const p of findPositions(inst, pc, to, from)) {
          if (seen.has(`${p.string}:${p.fret}`)) continue
          seen.add(`${p.string}:${p.fret}`)
          out.push({ ...p, tone: 'ghost', label: intervalBetween(scale.root, pc).short })
        }
    }
  }
  const maxFret = Math.max(12, ...markers.map((m) => m.fret + 1))

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="eyebrow">Compasso {bar + 1}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => onBar(Math.max(0, bar - 1))} className="grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Compasso anterior">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <Kbd>[</Kbd>
          <Kbd>]</Kbd>
          <button onClick={() => onBar(Math.min(score.masterBars.length - 1, bar + 1))} className="grid place-items-center size-9 rounded-lg text-pearl-dim hover:text-pearl hover:bg-wood-800" aria-label="Próximo compasso">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="text-xs text-pearl-faint">Clique num compasso da tablatura, ou toque a música: a análise acompanha o cursor.</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chords.length ? (
          chords.map((c, i) => (
            <button key={i} onClick={() => hearChord(c)} className={`rounded-lg border px-2.5 py-1.5 text-left hover:bg-wood-800 ${c.diatonic ? 'border-enclosure/60' : 'border-led-amber/60'}`} title="Ouvir o acorde">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-pearl-faint">
                {c.roman}
                {functionOf(c.root, k) && c.diatonic ? ` · ${functionOf(c.root, k)}` : ' · fora do campo'}
                <Volume2 className="size-3" aria-hidden />
              </span>
              <span className="font-display text-2xl font-black">{c.name}</span>
              <span className="block text-[11px] text-pearl-faint">{CHORDS[c.quality].name}</span>
            </button>
          ))
        ) : (
          <p className="text-sm text-pearl-dim">{all.length ? 'Sem acorde claro: é melodia ou passagem.' : 'Compasso vazio (pausa).'}</p>
        )}
      </div>

      {rest && (
        <div className="mt-3 rounded-xl bg-wood-950/60 border border-wood-700/60 p-3">
          <p className="eyebrow">Nota de repouso {track && <span className="normal-case tracking-normal font-normal">· {track.name}</span>}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-black">{noteName(mod12(rest.midi), flats)}</span>
            <span className="text-sm text-pearl-dim">
              {chordAt(rest.pos) && <>{ROLE[intervalBetween(chordAt(rest.pos)!.root, mod12(rest.midi)).short]} de {chordAt(rest.pos)!.name} · </>}
              grau {INTERVAL_SHORT(mod12(rest.midi - k.root))} do tom
            </span>
          </p>
          <p className="text-xs text-pearl-faint">A nota onde a frase "descansa": a mais longa, valorizando o tempo forte e o fim do compasso.</p>
        </div>
      )}

      {played.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-semibold">Notas tocadas</h3>
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {dedupe(played).map((n, i) => {
              const c = chordAt(n.pos)
              const inChord = c && CHORDS[c.quality].formula.includes(mod12(n.midi - c.root) as never)
              return (
                <li key={i} className={`rounded-md border px-1.5 py-0.5 text-center ${inChord ? 'border-enclosure/50' : 'border-wood-700'}`} title={c ? `${ROLE[intervalBetween(c.root, mod12(n.midi)).short]} de ${c.name}` : undefined}>
                  <span className="block font-semibold text-sm">{noteName(mod12(n.midi), flats)}</span>
                  <span className="block font-mono text-[10px] text-pearl-faint">
                    {c ? intervalBetween(c.root, mod12(n.midi)).short : '–'} · {INTERVAL_SHORT(mod12(n.midi - k.root))}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 text-[11px] text-pearl-faint">Embaixo de cada nota: intervalo no acorde · grau no tom. Borda laranja = nota do acorde.</p>
        </>
      )}

      {scales.length > 0 && (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Escalas que servem aqui</h3>
          </div>
          <div className="mt-1.5">
            <Segmented<string>
              label="Escala"
              value={String(Math.min(pick, scales.length - 1))}
              onChange={(v) => setPick(Number(v))}
              options={scales.map((s, i) => ({ value: String(i), label: `${noteName(s.root, flats)} ${SCALES[s.scale as ScaleId].name.toLowerCase()}` }))}
            />
          </div>
          <p className="mt-1 text-[11px] text-pearl-faint">Todas contêm as notas deste compasso. No braço: notas tocadas cheias (laranja = fundamental do acorde), escala tracejada.</p>
        </>
      )}
      {markers.length > 0 && (
        <div className="mt-2 -mx-2 overflow-x-auto">
          <Fretboard inst={inst} to={Math.min(inst.frets, maxFret)} markers={markers} leftHanded={leftHanded} orientation="horizontal" />
        </div>
      )}
    </section>
  )
}

/** Remove repetições seguidas da mesma nota (riffs em colcheias repetidas). */
function dedupe(ns: SongNote[]) {
  return ns.filter((n, i) => i === 0 || n.midi !== ns[i - 1].midi).slice(0, 32)
}
