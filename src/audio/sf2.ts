/*
  Leitor mínimo de SoundFont 2 (.sf2): só o necessário para tocar uma nota de um preset General MIDI
  fora do alphaTab (treino de ouvido). Puro, sem Web Audio, para testar no Node.
*/

export interface SfSample {
  start: number
  end: number
  loopStart: number
  loopEnd: number
  sampleRate: number
  originalPitch: number
  pitchCorrection: number
}

export interface SfZone {
  sample: number
  keyLo: number
  keyHi: number
  velLo: number
  velHi: number
  rootKey: number
  /** afinação extra em cents (coarse, fine e correção do sample) */
  tuneCents: number
  /** atenuação em dB */
  attenuation: number
  loop: boolean
  /** ajustes de endereço do sample (em amostras) */
  startOffset: number
  endOffset: number
  loopStartOffset: number
  loopEndOffset: number
}

export interface SoundFont {
  /** áudio 16 bits de todos os samples */
  data: Int16Array
  samples: SfSample[]
  /** "banco:programa" → zonas já resolvidas (preset + instrumento) */
  presets: Map<string, SfZone[]>
}

type Gens = Map<number, number>
const G = {
  startOffset: 0, endOffset: 1, startLoopOffset: 2, endLoopOffset: 3, startCoarse: 4, endCoarse: 12,
  instrument: 41, keyRange: 43, velRange: 44, startLoopCoarse: 45, attenuation: 48, endLoopCoarse: 50,
  coarseTune: 51, fineTune: 52, sampleID: 53, sampleModes: 54, rootKey: 58,
}

function readChunks(view: DataView, start: number, end: number) {
  const out = new Map<string, { offset: number; size: number }>()
  for (let p = start; p + 8 <= end; ) {
    const id = String.fromCharCode(view.getUint8(p), view.getUint8(p + 1), view.getUint8(p + 2), view.getUint8(p + 3))
    const size = view.getUint32(p + 4, true)
    const key = id === 'LIST' ? `LIST:${String.fromCharCode(view.getUint8(p + 8), view.getUint8(p + 9), view.getUint8(p + 10), view.getUint8(p + 11))}` : id
    out.set(key, { offset: p + 8, size })
    p += 8 + size + (size % 2)
  }
  return out
}

/** Lê um .sf2 inteiro. Lança erro se não for um SoundFont. */
export function parseSf2(buf: ArrayBuffer): SoundFont {
  const view = new DataView(buf)
  const tag = (o: number) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3))
  if (tag(0) !== 'RIFF' || tag(8) !== 'sfbk') throw new Error('Não é um arquivo SoundFont (.sf2).')
  const top = readChunks(view, 12, Math.min(buf.byteLength, 8 + view.getUint32(4, true)))
  const sdta = top.get('LIST:sdta')
  const pdta = top.get('LIST:pdta')
  if (!sdta || !pdta) throw new Error('SoundFont incompleto.')
  const smpl = readChunks(view, sdta.offset + 4, sdta.offset + sdta.size).get('smpl')!
  // o chunk costuma estar em posição par; se não estiver, copia para alinhar
  const data = smpl.offset % 2 === 0 ? new Int16Array(buf, smpl.offset, smpl.size >> 1) : new Int16Array(buf.slice(smpl.offset, smpl.offset + smpl.size))
  const p = readChunks(view, pdta.offset + 4, pdta.offset + pdta.size)
  const recs = (id: string, size: number) => {
    const c = p.get(id)!
    return Array.from({ length: Math.floor(c.size / size) }, (_, i) => c.offset + i * size)
  }
  const bags = (id: string) => recs(id, 4).map((o) => view.getUint16(o, true))
  const gens = (id: string) => recs(id, 4).map((o) => ({ oper: view.getUint16(o, true), amount: view.getInt16(o + 2, true), lo: view.getUint8(o + 2), hi: view.getUint8(o + 3) }))

  const samples: SfSample[] = recs('shdr', 46).map((o) => ({
    start: view.getUint32(o + 20, true),
    end: view.getUint32(o + 24, true),
    loopStart: view.getUint32(o + 28, true),
    loopEnd: view.getUint32(o + 32, true),
    sampleRate: view.getUint32(o + 36, true),
    originalPitch: view.getUint8(o + 40),
    pitchCorrection: view.getInt8(o + 41),
  }))

  const pbag = bags('pbag'), pgen = gens('pgen'), ibag = bags('ibag'), igen = gens('igen')
  const instBag = recs('inst', 22).map((o) => view.getUint16(o + 20, true))
  const phdr = recs('phdr', 38).map((o) => ({ preset: view.getUint16(o + 20, true), bank: view.getUint16(o + 22, true), bag: view.getUint16(o + 24, true) }))

  // geradores de cada zona; faixas (key/vel) guardadas como lo | hi << 8
  const zoneGens = (bagList: number[], genList: typeof pgen, from: number, to: number): Gens[] => {
    const zones: Gens[] = []
    for (let b = from; b < to; b++) {
      const g: Gens = new Map()
      for (let k = bagList[b]; k < bagList[b + 1]; k++) {
        const { oper, amount, lo, hi } = genList[k]
        g.set(oper, oper === G.keyRange || oper === G.velRange ? lo | (hi << 8) : amount)
      }
      zones.push(g)
    }
    return zones
  }
  const range = (g: Gens, op: number): [number, number] => {
    const v = g.get(op)
    return v === undefined ? [0, 127] : [v & 0xff, v >> 8]
  }
  const withGlobal = (zones: Gens[], terminal: number) => {
    const global = zones.length && !zones[0].has(terminal) ? zones[0] : new Map<number, number>()
    return { global, locals: zones.filter((z) => z.has(terminal)) }
  }

  const presets = new Map<string, SfZone[]>()
  for (let i = 0; i < phdr.length - 1; i++) {
    const h = phdr[i]
    const { global: pg, locals: pzones } = withGlobal(zoneGens(pbag, pgen, h.bag, phdr[i + 1].bag), G.instrument)
    const out: SfZone[] = []
    for (const pz of pzones) {
      const pv = (op: number) => pz.get(op) ?? pg.get(op) ?? 0
      const [pkLo, pkHi] = range(pz.has(G.keyRange) ? pz : pg, G.keyRange)
      const inst = pz.get(G.instrument)!
      const { global: ig, locals: izones } = withGlobal(zoneGens(ibag, igen, instBag[inst], instBag[inst + 1]), G.sampleID)
      for (const iz of izones) {
        const iv = (op: number, def = 0) => iz.get(op) ?? ig.get(op) ?? def
        const [ikLo, ikHi] = range(iz.has(G.keyRange) ? iz : ig, G.keyRange)
        const [vLo, vHi] = range(iz.has(G.velRange) ? iz : ig, G.velRange)
        const keyLo = Math.max(pkLo, ikLo), keyHi = Math.min(pkHi, ikHi)
        if (keyLo > keyHi) continue
        const s = samples[iz.get(G.sampleID)!]
        if (!s) continue
        const root = iv(G.rootKey, -1)
        out.push({
          sample: iz.get(G.sampleID)!,
          keyLo, keyHi, velLo: vLo, velHi: vHi,
          rootKey: root >= 0 ? root : s.originalPitch,
          tuneCents: (iv(G.coarseTune) + pv(G.coarseTune)) * 100 + iv(G.fineTune) + pv(G.fineTune) + s.pitchCorrection,
          attenuation: (iv(G.attenuation) + pv(G.attenuation)) / 10,
          loop: (iv(G.sampleModes) & 1) === 1,
          startOffset: iv(G.startOffset) + iv(G.startCoarse) * 32768,
          endOffset: iv(G.endOffset) + iv(G.endCoarse) * 32768,
          loopStartOffset: iv(G.startLoopOffset) + iv(G.startLoopCoarse) * 32768,
          loopEndOffset: iv(G.endLoopOffset) + iv(G.endLoopCoarse) * 32768,
        })
      }
    }
    presets.set(`${h.bank}:${h.preset}`, out)
  }
  return { data, samples, presets }
}

/** Zonas que tocam esta nota (velocidade 100) num programa GM; cai no banco 0 se faltar. */
export function zonesFor(sf: SoundFont, program: number, midi: number, bank = 0): SfZone[] {
  const zones = sf.presets.get(`${bank}:${program}`) ?? sf.presets.get(`0:${program}`) ?? []
  return zones.filter((z) => midi >= z.keyLo && midi <= z.keyHi && 100 >= z.velLo && 100 <= z.velHi)
}

/** Velocidade de reprodução do sample para soar a nota pedida. */
export const playbackRate = (z: SfZone, midi: number) => 2 ** ((midi - z.rootKey) / 12 + z.tuneCents / 1200)

/** Programas General MIDI usados pelo app (0 = primeiro). */
export const GM = { fingerBass: 33, cleanGuitar: 27 } as const
