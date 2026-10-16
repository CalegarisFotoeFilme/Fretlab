import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ExternalLink, FileMusic, LayoutGrid, Link2, List, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, PageHeader, Segmented } from '../components/ui'
import { Kbd } from '../components/useHotkeys'
import { Playlists } from '../library/Playlists'
import { readTracksMeta, songTunings } from '../library/songMeta'
import { BulkImportButton, BulkImportPanel } from '../library/BulkImportPanel'
import { useSettings } from '../progress/settings'
import { updateSong } from '../progress/songs'
import { openSongsterr, parseSongsterrUrl } from '../library/alphatab'
import { isDesktop } from '../library/desktop'
import { GP_ACCEPT, songFromFile } from '../library/importSong'
import { db, type Song } from '../progress/db'


/** Lê, em segundo plano, as faixas e afinações das músicas que ainda não têm (uma por vez). */
function useTrackScan(all: Song[] | undefined) {
  // sem leitura ou leitura antiga (sem o instrumento MIDI): lê de novo
  const stale = (s: Song) => !s.tracks || s.tracks.some((t) => t.program === undefined)
  const pending = all?.filter((s) => s.file && stale(s)).map((s) => s.id!) ?? []
  const key = pending.join(',')
  useEffect(() => {
    if (!key) return
    let cancelled = false
    void (async () => {
      for (const id of key.split(',').map(Number)) {
        if (cancelled) return
        const song = await db.songs.get(id)
        if (!song?.file || (song.tracks && !song.tracks.some((t) => t.program === undefined))) continue
        // arquivo ilegível: lista vazia (não tenta de novo a cada visita)
        const tracks = await readTracksMeta(song).catch(() => [])
        if (!cancelled) await updateSong(id, { tracks })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key])
  return pending.length
}

/** Músicas agrupadas por artista (A–Z), com as do mesmo artista em ordem de título. */
function groupByArtist(songs: Song[]) {
  const groups = new Map<string, Song[]>()
  for (const s of sortSongs(songs, 'artist')) {
    const a = s.artist.trim() || 'Artista desconhecido'
    groups.set(a, [...(groups.get(a) ?? []), s])
  }
  return [...groups.entries()].map(([artist, songs]) => ({ artist, songs }))
}

/** Cabeçalho do grupo do artista (começa recolhido, para achar o artista rápido); sem artista, só mostra as músicas. */
function ArtistGroup({ artist, count, children }: { artist: string | null; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  if (artist === null) return <>{children}</>
  return (
    <section className="mb-6">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mb-3 flex w-full items-center gap-3 border-b border-wood-700 pb-2 text-left hover:text-enclosure">
        <ChevronDown className={`size-5 transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
        <span className="font-display text-2xl font-black uppercase">{artist}</span>
        <span className="font-mono text-sm text-pearl-faint">{count} {count === 1 ? 'música' : 'músicas'}</span>
      </button>
      {open && children}
    </section>
  )
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
/** ordena a biblioteca: mais recentes, por título ou por artista (e título dentro do artista) */
function sortSongs(songs: Song[], by: 'added' | 'title' | 'artist' | 'group') {
  const xs = [...songs]
  if (by === 'added') return xs.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
  if (by === 'title') return xs.sort((a, b) => collator.compare(a.title, b.title))
  return xs.sort((a, b) => collator.compare(a.artist || '~', b.artist || '~') || collator.compare(a.title, b.title))
}

export function LibraryPage() {
  const all = useLiveQuery(() => db.songs.toArray())
  const sortBy = useSettings((s) => s.librarySort)
  const view = useSettings((s) => s.libraryView)
  const setSettings = useSettings((s) => s.set)
  // filtros: instrumento e afinação (só as afinações que existem nas músicas da biblioteca)
  const instFilter = useSettings((s) => s.libraryInstrument)
  const tuningPick = useSettings((s) => s.libraryTuning)
  const userFamily = useSettings((s) => (s.instrument === 'guitar6' ? 'guitar' : 'bass'))
  const family = instFilter === 'any' ? userFamily : instFilter
  const ofInstrument = all?.filter((s) => instFilter === 'any' || s.tracks?.some((t) => t.family === instFilter)) ?? []
  const tuningCounts = new Map<string, number>()
  if (instFilter !== 'any') for (const s of ofInstrument) for (const t of songTunings(s, instFilter)) tuningCounts.set(t, (tuningCounts.get(t) ?? 0) + 1)
  const tuningFilter = tuningPick && tuningCounts.has(tuningPick) ? tuningPick : null
  const filtered = instFilter !== 'any' && tuningFilter ? ofInstrument.filter((s) => songTunings(s, instFilter).includes(tuningFilter)) : ofInstrument
  const songs = all && sortSongs(filtered, sortBy)
  const scanning = useTrackScan(all)
  const [tab, setTab] = useState<'musicas' | 'repertorios'>('musicas')
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()

  const importFile = async (file: File) => {
    try {
      setStatus(null)
      const id = await db.songs.add(await songFromFile(file, setStatus))
      navigate(`/musicas/${id}`)
    } catch (e) {
      setStatus((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-10 pt-8">
      <PageHeader eyebrow="Repertório" title="Músicas">
        Importe as tabs que você baixa no Songsterr (Guitar Pro ou MIDI) e toque aqui com velocidade, loop e a teoria da música ao lado.
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-8">
        <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-enclosure text-wood-950 font-semibold cursor-pointer shadow-[0_3px_0_var(--color-enclosure-deep)] hover:brightness-105 focus-within:outline-2 focus-within:outline-enclosure">
          <Upload className="size-4" aria-hidden /> Importar Guitar Pro ou MIDI
          <input type="file" accept={GP_ACCEPT} className="sr-only" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        </label>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Link2 className="size-4" aria-hidden /> Adicionar link do Songsterr
        </Button>
        {isDesktop() && (
          <Button variant="secondary" onClick={() => openSongsterr('https://www.songsterr.com/')}>
            <ExternalLink className="size-4" aria-hidden /> Abrir o Songsterr ao lado
          </Button>
        )}
        {isDesktop() && <BulkImportButton />}
      </div>
      {isDesktop() && (
        <p className="-mt-5 mb-8 text-sm text-pearl-faint">
          No app para Mac, o que você baixar (Guitar Pro ou MIDI) na janela do Songsterr entra sozinho aqui na biblioteca e abre na hora. O arquivo original fica guardado em ~/Library/Application Support/br.fretlab.desktop/musicas.
        </p>
      )}

      {isDesktop() && <BulkImportPanel />}
      {status && (
        <p role="status" className="panel p-3 mb-6 text-pearl-dim">
          {status}
        </p>
      )}
      {adding && <AddLink onDone={() => setAdding(false)} />}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented<'musicas' | 'repertorios'>
          label="Ver"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'musicas', label: `Músicas${all ? ` (${all.length})` : ''}` },
            { value: 'repertorios', label: 'Repertórios' },
          ]}
        />
        {tab === 'musicas' && (
          <Segmented<'added' | 'title' | 'artist' | 'group'>
            label="Ordenar"
            value={sortBy}
            onChange={(v) => setSettings({ librarySort: v })}
            options={[
              { value: 'added', label: 'Mais recentes' },
              { value: 'title', label: 'Música A–Z' },
              { value: 'artist', label: 'Artista A–Z' },
              { value: 'group', label: 'Agrupar por artista' },
            ]}
          />
        )}
        {tab === 'musicas' && (
          <Segmented<'any' | 'bass' | 'guitar'>
            label="Instrumento"
            value={instFilter}
            onChange={(v) => setSettings({ libraryInstrument: v, libraryTuning: null })}
            options={[
              { value: 'any', label: 'Qualquer instrumento' },
              { value: 'bass', label: 'Baixo' },
              { value: 'guitar', label: 'Guitarra' },
            ]}
          />
        )}
        {tab === 'musicas' && instFilter !== 'any' && (
          <select
            value={tuningFilter ?? ''}
            onChange={(e) => setSettings({ libraryTuning: e.target.value || null })}
            aria-label="Afinação"
            className="min-h-11 rounded-xl bg-wood-950 border border-wood-700 px-3 text-pearl focus:border-enclosure outline-none"
          >
            <option value="">Qualquer afinação ({ofInstrument.length})</option>
            {[...tuningCounts.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => (
              <option key={t} value={t}>
                {t} ({n})
              </option>
            ))}
          </select>
        )}
        {tab === 'musicas' && scanning > 0 && <span className="text-sm text-pearl-faint">Lendo afinações… faltam {scanning}</span>}
        {tab === 'musicas' && (
          <Button variant="ghost" className="ml-auto" onClick={() => setSettings({ libraryView: view === 'list' ? 'cards' : 'list' })} title={view === 'list' ? 'Ver em cards' : 'Ver em lista'}>
            {view === 'list' ? <LayoutGrid className="size-4" aria-hidden /> : <List className="size-4" aria-hidden />} {view === 'list' ? 'Cards' : 'Lista'}
          </Button>
        )}
      </div>

      {tab === 'repertorios' ? (
        <Playlists songs={all ?? []} />
      ) : (
        <>
          {all && all.length === 0 && !adding && <EmptyState />}
          {all && all.length > 0 && songs?.length === 0 && (
            <p className="panel p-4 text-pearl-dim">
              Nenhuma música com esse filtro.{' '}
              <button className="text-enclosure underline" onClick={() => setSettings({ libraryInstrument: 'any', libraryTuning: null })}>
                Mostrar todas
              </button>
            </p>
          )}
          {(sortBy === 'group' ? groupByArtist(songs ?? []) : [{ artist: null, songs: songs ?? [] }]).map((g) => (
            <ArtistGroup key={g.artist ?? '*'} artist={g.artist} count={g.songs.length}>
              {view === 'list' ? (
                <ul className="panel overflow-hidden">
                  {g.songs.map((s) => <SongItem key={s.id} song={s} list family={family} />)}
                </ul>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1900px]:grid-cols-4">
                  {g.songs.map((s) => <SongItem key={s.id} song={s} list={false} family={family} />)}
                </ul>
              )}
            </ArtistGroup>
          ))}
        </>
      )}
    </div>
  )
}

const ORIGIN = (s: Song) => (s.origin === 'midi' ? 'MIDI → tab' : s.origin === 'musicxml' ? 'MusicXML' : 'Guitar Pro')

/** Uma música da biblioteca, em card ou em linha. Editar (lápis) também permite trocar o arquivo. */
function SongItem({ song, list, family }: { song: Song; list: boolean; family: 'bass' | 'guitar' }) {
  const tunings = songTunings(song, family)
  // confirmação na própria página (diálogos do navegador nem sempre aparecem)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const remove = () => {
    if (confirming) void db.songs.delete(song.id!)
    else setConfirming(true)
  }
  if (editing) return <EditSong song={song} list={list} onDone={() => setEditing(false)} />

  const actions = confirming ? (
    <span className="flex items-center gap-1">
      <Button variant="ghost" onClick={() => setConfirming(false)}>Manter</Button>
      <Button variant="secondary" className="text-led-red" onClick={remove}>Remover</Button>
    </span>
  ) : (
    <span className="flex">
      <Button variant="ghost" className="min-w-11 px-2" onClick={() => setEditing(true)} aria-label={`Editar ${song.title}`} title="Editar nome, artista ou arquivo">
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button variant="ghost" className="min-w-11 px-2" onClick={remove} aria-label={`Remover ${song.title}`} title="Remover">
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </span>
  )
  const open = song.file && (
    <Link to={`/musicas/${song.id}`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-wood-800 border border-wood-600/60 font-semibold hover:bg-wood-700">
      Abrir no FretLab
    </Link>
  )
  const songsterr = song.songsterrUrl && (
    <Button variant="secondary" onClick={() => openSongsterr(song.songsterrUrl!)}>
      <ExternalLink className="size-4" aria-hidden /> {list ? 'Songsterr' : 'Songsterr ao lado'}
    </Button>
  )
  // sem arquivo ainda (só o link): anexar fica à vista; trocar um arquivo existente fica na edição
  const attach = !song.file && <FilePicker song={song} label="Anexar Guitar Pro" />

  if (list)
    return (
      <li className="flex items-center gap-4 border-b border-wood-700/60 px-3 py-2 hover:bg-wood-900/60">
        <FileMusic className="size-5 text-enclosure shrink-0" aria-hidden />
        <Link to={song.file ? `/musicas/${song.id}` : '#'} className="min-w-0 flex-1 grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] md:gap-4">
          <span className="truncate font-semibold">{song.title}</span>
          <span className="truncate text-pearl-dim">{song.artist || 'Artista desconhecido'}</span>
        </Link>
        <span className="hidden lg:flex w-44 gap-3">
          {song.file && <span className="eyebrow">{ORIGIN(song)}</span>}
          {song.songsterrUrl && <span className="eyebrow">Songsterr</span>}
        </span>
        <span className="hidden md:block w-40 truncate text-sm text-enclosure" title={`Afinação (${family === 'bass' ? 'baixo' : 'guitarra'})`}>{tunings.join(' / ')}</span>
        <span className="flex items-center gap-2">
          {songsterr}
          {attach}
          {actions}
        </span>
      </li>
    )

  return (
    <li className="panel p-4 flex flex-col gap-3 hover:border-wood-600 transition-colors">
      <div className="flex items-start gap-3">
        <FileMusic className="size-6 text-enclosure shrink-0 mt-1" aria-hidden />
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-lg font-bold truncate">{song.title}</h2>
          <p className="text-sm text-pearl-dim truncate">{song.artist || 'Artista desconhecido'}</p>
          <div className="mt-1 flex gap-3">
            {song.file && <span className="eyebrow">{ORIGIN(song)}</span>}
            {song.songsterrUrl && <span className="eyebrow">Songsterr</span>}
            {tunings.length > 0 && <span className="eyebrow text-enclosure" title={`Afinação (${family === 'bass' ? 'baixo' : 'guitarra'})`}>{tunings.join(' / ')}</span>}
          </div>
        </div>
        {actions}
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {open}
        {songsterr}
        {attach}
      </div>
    </li>
  )
}

function FilePicker({ song, label, onPicked }: { song: Song; label: string; onPicked?: () => void }) {
  return (
    <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800/60 font-semibold cursor-pointer focus-within:outline-2 focus-within:outline-enclosure">
      <Plus className="size-4" aria-hidden /> {label}
      <input
        type="file"
        accept={GP_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void songFromFile(f).then(({ file, fileName, origin, skippedTracks }) => updateSong(song.id!, { file, fileName, origin, skippedTracks })).then(onPicked)
        }}
      />
    </label>
  )
}

function EditSong({ song, list, onDone }: { song: Song; list: boolean; onDone: () => void }) {
  const [title, setTitle] = useState(song.title)
  const [artist, setArtist] = useState(song.artist)
  const save = async () => {
    await updateSong(song.id!, { title: title.trim() || song.title, artist: artist.trim() })
    onDone()
  }
  return (
    <li className={list ? 'border-b border-wood-700/60 px-3 py-3' : 'panel p-4'}>
      <form
        className={list ? 'grid gap-3 md:grid-cols-[2fr_1.3fr_auto] md:items-end' : 'grid gap-3'}
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        onKeyDown={(e) => e.key === 'Escape' && onDone()}
      >
        <Input label="Música" value={title} onChange={setTitle} autoFocus />
        <Input label="Artista" value={artist} onChange={setArtist} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Salvar <Kbd>enter</Kbd></Button>
          <Button type="button" variant="ghost" onClick={onDone}>Cancelar <Kbd>esc</Kbd></Button>
          <FilePicker song={song} label={song.file ? 'Trocar arquivo' : 'Anexar Guitar Pro'} onPicked={onDone} />
        </div>
      </form>
    </li>
  )
}

function AddLink({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const valid = /songsterr\.com\//.test(url)

  const onUrl = (v: string) => {
    setUrl(v)
    const guess = parseSongsterrUrl(v)
    if (guess && !title) setTitle(guess.title)
  }

  const save = async () => {
    await db.songs.add({ title: title || 'Sem título', artist, songsterrUrl: url, addedAt: Date.now() })
    onDone()
  }

  return (
    <form
      className="panel p-4 mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) void save()
      }}
      onKeyDown={(e) => e.key === 'Escape' && onDone()}
    >
      <Input label="Link da música no Songsterr" value={url} onChange={onUrl} placeholder="https://www.songsterr.com/a/wsa/…" autoFocus />
      <Input label="Música" value={title} onChange={setTitle} />
      <Input label="Artista" value={artist} onChange={setArtist} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

function Input({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-pearl-dim">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-xl bg-wood-950 border border-wood-700 px-3 text-base text-pearl placeholder:text-pearl-faint focus:border-enclosure outline-none"
        {...rest}
      />
    </label>
  )
}

function EmptyState() {
  return (
    <div className="panel p-6 md:p-8 grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="text-3xl font-black uppercase">Traga suas músicas</h2>
        <p className="mt-2 text-pearl-dim">Dois jeitos de usar junto com o Songsterr.</p>
      </div>
      <ol className="grid gap-4 text-pearl/90">
        <li>
          <p className="font-semibold">Baixar o arquivo da música</p>
          <p className="text-sm text-pearl-dim">
            No Songsterr, baixe a música como Guitar Pro ou MIDI (recursos do Plus). O FretLab lê os dois: o MIDI do Songsterr guarda a corda de cada nota, então a tablatura sai igual. Depois é só tocar com loop, velocidade e a análise teórica.
          </p>
        </li>
        <li>
          <p className="font-semibold">Songsterr ao lado</p>
          <p className="text-sm text-pearl-dim">
            Salve o link e abra o Songsterr numa janela ao lado do FretLab. No Mac, passe o mouse no botão verde da janela e escolha colocar a janela de um lado da tela.
          </p>
        </li>
      </ol>
    </div>
  )
}
