import { useLiveQuery } from 'dexie-react-hooks'
import { ExternalLink, FileMusic, Link2, Plus, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, PageHeader } from '../components/ui'
import { openSongsterr, parseSongsterrUrl } from '../library/alphatab'
import { db, type Song } from '../progress/db'

const GP_ACCEPT = '.gp,.gp3,.gp4,.gp5,.gpx,.gp7,.musicxml,.xml'

export function LibraryPage() {
  const songs = useLiveQuery(() => db.songs.orderBy('addedAt').reverse().toArray())
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  const importFile = async (file: File) => {
    const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
    const id = await db.songs.add({ title, artist: '', file, fileName: file.name, addedAt: Date.now() })
    navigate(`/musicas/${id}`)
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-10 pt-8">
      <PageHeader eyebrow="Repertório" title="Músicas">
        Importe as tabs que você baixa no Songsterr (Guitar Pro) e toque aqui com velocidade, loop e a teoria da música ao lado.
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-8">
        <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-enclosure text-wood-950 font-semibold cursor-pointer shadow-[0_3px_0_var(--color-enclosure-deep)] hover:brightness-105 focus-within:outline-2 focus-within:outline-enclosure">
          <Upload className="size-4" aria-hidden /> Importar arquivo Guitar Pro
          <input type="file" accept={GP_ACCEPT} className="sr-only" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        </label>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Link2 className="size-4" aria-hidden /> Adicionar link do Songsterr
        </Button>
      </div>

      {adding && <AddLink onDone={() => setAdding(false)} />}

      {songs && songs.length === 0 && !adding && <EmptyState />}

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1900px]:grid-cols-4">
        {songs?.map((s) => <SongCard key={s.id} song={s} />)}
      </ul>
    </div>
  )
}

function SongCard({ song }: { song: Song }) {
  const remove = () => {
    if (confirm(`Remover "${song.title}" da biblioteca?`)) void db.songs.delete(song.id!)
  }
  return (
    <li className="panel p-4 flex flex-col gap-3 hover:border-wood-600 transition-colors">
      <div className="flex items-start gap-3">
        <FileMusic className="size-6 text-enclosure shrink-0 mt-1" aria-hidden />
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-lg font-bold truncate">{song.title}</h2>
          <p className="text-sm text-pearl-dim truncate">{song.artist || 'Artista desconhecido'}</p>
          <div className="mt-1 flex gap-3">
            {song.file && <span className="eyebrow">Guitar Pro</span>}
            {song.songsterrUrl && <span className="eyebrow">Songsterr</span>}
          </div>
        </div>
        <Button variant="ghost" className="min-w-11 px-2" onClick={remove} aria-label={`Remover ${song.title}`} title="Remover">
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {song.file && (
          <Link to={`/musicas/${song.id}`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-wood-800 border border-wood-600/60 font-semibold hover:bg-wood-700">
            Abrir no FretLab
          </Link>
        )}
        {song.songsterrUrl && (
          <Button variant="secondary" onClick={() => openSongsterr(song.songsterrUrl!)}>
            <ExternalLink className="size-4" aria-hidden /> Songsterr ao lado
          </Button>
        )}
        {!song.file && (
          <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-pearl-dim hover:text-pearl hover:bg-wood-800/60 font-semibold cursor-pointer focus-within:outline-2 focus-within:outline-enclosure">
            <Plus className="size-4" aria-hidden /> Anexar Guitar Pro
            <input
              type="file"
              accept={GP_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void db.songs.update(song.id!, { file: f, fileName: f.name })
              }}
            />
          </label>
        )}
      </div>
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
          <p className="font-semibold">Baixar o Guitar Pro</p>
          <p className="text-sm text-pearl-dim">
            No Songsterr, abra a música e baixe como Guitar Pro (recurso do Plus). Importe o arquivo aqui para tocar com loop, velocidade e a análise teórica.
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
