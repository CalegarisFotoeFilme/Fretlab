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

/** Lê os bytes de um arquivo baixado pela janela do Songsterr. */
export async function readDownload(path: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  return new Uint8Array(await invoke<number[]>('read_download', { path }))
}
