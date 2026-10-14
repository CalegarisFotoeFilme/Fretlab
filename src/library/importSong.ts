import type { Song } from '../progress/db'

export const GP_ACCEPT = '.gp,.gp3,.gp4,.gp5,.gpx,.gp7,.musicxml,.xml,.mid,.midi'
const isMidi = (f: File) => /\.midi?$/i.test(f.name)
/** Arquivo de tablatura que a biblioteca sabe abrir? */
export const isSongFile = (name: string) => /\.(gp[3-7x]?|musicxml|xml|midi?)$/i.test(name)

/** Lê o arquivo escolhido. O MIDI é guardado como veio e convertido em tablatura ao abrir a música. */
export async function songFromFile(file: File, onStatus?: (s: string) => void): Promise<Song> {
  if (isMidi(file)) {
    onStatus?.('Lendo o MIDI…')
    const [{ loadAlphaTab }, { midiToScore }] = await Promise.all([import('./alphatab'), import('./midiImport')])
    // converte já na importação para validar o arquivo e descobrir título e artista
    const r = midiToScore(await loadAlphaTab(), new Uint8Array(await file.arrayBuffer()), file.name)
    return { title: r.title, artist: r.artist, file, fileName: file.name, origin: 'midi', addedAt: Date.now() }
  }
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  const origin = /\.(musicxml|xml)$/i.test(file.name) ? 'musicxml' : 'gp'
  return { title, artist: '', file, fileName: file.name, origin, addedAt: Date.now() }
}
