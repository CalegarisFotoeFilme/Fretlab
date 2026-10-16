// Ponte com o casco desktop (Tauri). No navegador, tudo aqui vira "não disponível".

export interface DesktopDownload {
  path: string
  name: string
  /** página do Songsterr aberta quando o download terminou */
  pageUrl?: string | null
}

/** O app está rodando dentro do FretLab para Mac (Tauri)? */
export const isDesktop = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Abre o Songsterr na janela do app, encaixada na metade direita da tela. */
export async function openSongsterrDesktop(url: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  try {
    await invoke('open_songsterr', { url })
  } catch (e) {
    // sem isso, uma recusa (permissão, monitor) some em silêncio e o botão "não faz nada"
    console.error('Não foi possível abrir o Songsterr ao lado:', e)
    throw e
  }
}

/** Avisa quando a janela do Songsterr termina de baixar um arquivo. Devolve a função para parar de ouvir. */
export async function onSongsterrDownload(cb: (d: DesktopDownload) => void) {
  const { listen } = await import('@tauri-apps/api/event')
  return listen<DesktopDownload>('songsterr-download', (e) => cb(e.payload))
}

/** Salva o backup em Downloads (o app para Mac não baixa arquivos pelo navegador). Devolve o caminho. */
export async function saveBackupDesktop(name: string, contents: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<string>('save_backup', { name, contents })
}

/** Lê uma música guardada na pasta "musicas" do app para Mac (pelo nome do arquivo). */
export async function readSavedSong(name: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  return new Uint8Array(await invoke<number[]>('read_saved_song', { name }))
}

/** Abre uma página na janela do Songsterr (abre a janela ao lado se preciso). */
export async function songsterrGo(url: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('songsterr_go', { url })
}

/** Roda um script na página do Songsterr; a resposta chega por `onSongsterrReport`. */
export async function songsterrEval(script: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('songsterr_eval', { script })
}

/** Mensagens que os scripts da página do Songsterr mandam de volta (JSON). */
export async function onSongsterrReport(cb: (data: unknown) => void) {
  const { listen } = await import('@tauri-apps/api/event')
  return listen<string>('songsterr-report', (e) => {
    try {
      cb(JSON.parse(e.payload))
    } catch {
      // mensagem quebrada: ignora
    }
  })
}

/** Lê os bytes de um arquivo baixado pela janela do Songsterr. */
export async function readDownload(path: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  return new Uint8Array(await invoke<number[]>('read_download', { path }))
}
