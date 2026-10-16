import { isDesktop, readSavedSong } from '../library/desktop'
import { db, type Song } from './db'

/*
  Gravar música no banco. No WebKit (app para Mac), regravar um registro que contém o arquivo
  (Blob) lido do próprio banco pode deixar o arquivo perdido ("The object can not be found here").
  Por isso toda alteração regrava uma cópia nova do arquivo, e as gravações vão em fila (mexer
  rápido em dois controles não perde nada).
*/

let queue: Promise<unknown> = Promise.resolve()

/** Altera uma música: um objeto com os campos novos ou uma função que muda o registro. */
export function updateSong(id: number, change: Partial<Song> | ((s: Song) => void)) {
  const run = queue.then(async () => {
    const s = await db.songs.get(id)
    if (!s) return
    const next: Song = { ...s }
    if (typeof change === 'function') change(next)
    else Object.assign(next, change)
    // arquivo não trocado: cópia nova dos mesmos bytes (se ele ainda puder ser lido)
    if (next.file && next.file === s.file) {
      try {
        next.file = new Blob([await s.file.arrayBuffer()], { type: s.file.type })
      } catch {
        // já perdido: tenta a cópia da pasta "musicas" (app para Mac); sem ela, grava sem o arquivo
        // (um Blob perdido impede gravar o registro) e o card oferece "Anexar Guitar Pro"
        const saved = isDesktop() && next.fileName ? await readSavedSong(next.fileName).catch(() => null) : null
        if (saved) next.file = new Blob([saved as BlobPart])
        else delete next.file
      }
    }
    await db.songs.put(next)
  })
  queue = run.catch(() => {})
  return run
}

export const LOST_FILE = 'O arquivo desta música se perdeu no armazenamento do app.'

/**
 * Bytes do arquivo da música. Se o arquivo se perdeu, no app para Mac ele é recuperado da pasta
 * "musicas" (onde os downloads do Songsterr ficam guardados) e regravado.
 */
export async function readSongBytes(song: Song): Promise<Uint8Array> {
  try {
    return new Uint8Array(await song.file!.arrayBuffer())
  } catch (e) {
    if (isDesktop() && song.fileName) {
      try {
        const bytes = await readSavedSong(song.fileName)
        await updateSong(song.id!, { file: new Blob([bytes as BlobPart]) })
        return bytes
      } catch {
        // não está na pasta (música importada de outro lugar)
      }
    }
    throw new Error(`${LOST_FILE} Na biblioteca, use "Trocar arquivo" no card da música e escolha o Guitar Pro (ou MIDI) de novo.`, { cause: e })
  }
}
