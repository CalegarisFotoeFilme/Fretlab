import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, GripVertical, ListMusic, Play, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../components/ui'
import { db, type Playlist, type Song } from '../progress/db'

/** Endereço de uma música dentro de um repertório (o player mostra anterior/próxima). */
export const playlistSongUrl = (pl: Playlist, i: number) => `/musicas/${pl.songIds[i]}?repertorio=${pl.id}&i=${i}`

/** Move o item `from` para a posição `to` (arrastar e soltar, ou setas). */
export function moveItem<T>(xs: T[], from: number, to: number): T[] {
  const out = [...xs]
  const [x] = out.splice(from, 1)
  out.splice(Math.max(0, Math.min(out.length, to)), 0, x)
  return out
}

/**
 * Repertórios: listas de músicas da biblioteca para estudar em ordem ("Treino igreja",
 * "Treino metal"…). A ordem muda arrastando (ou com as setas); "Estudar" abre a primeira e o player
 * leva para a próxima.
 */
export function Playlists({ songs }: { songs: Song[] }) {
  const playlists = useLiveQuery(() => db.playlists.orderBy('name').toArray())
  const [selected, setSelected] = useState<number | null>(null)
  const [name, setName] = useState('')
  const current = playlists?.find((p) => p.id === selected) ?? playlists?.[0]

  const create = async () => {
    const n = name.trim()
    if (!n) return
    const id = (await db.playlists.add({ name: n, songIds: [], createdAt: Date.now() })) as number
    setName('')
    setSelected(id)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="panel p-4 flex flex-col gap-3 self-start">
        <p className="eyebrow">Seus repertórios</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void create()
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Novo: Treino igreja, Treino metal…"
            aria-label="Nome do novo repertório"
            className="min-h-11 flex-1 min-w-0 rounded-xl bg-wood-950 border border-wood-700 px-3 text-pearl placeholder:text-pearl-faint focus:border-enclosure outline-none"
          />
          <Button type="submit" disabled={!name.trim()} aria-label="Criar repertório">
            <Plus className="size-4" aria-hidden /> Criar
          </Button>
        </form>
        {playlists?.length === 0 && <p className="text-sm text-pearl-faint">Crie um repertório e adicione músicas da biblioteca na ordem em que quer estudar.</p>}
        <ul className="grid gap-1" role="listbox" aria-label="Repertórios">
          {playlists?.map((pl) => (
            <li key={pl.id}>
              <button
                role="option"
                aria-selected={current?.id === pl.id}
                onClick={() => setSelected(pl.id!)}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${current?.id === pl.id ? 'bg-wood-700 text-pearl font-semibold' : 'text-pearl-dim hover:bg-wood-800'}`}
              >
                <span className="flex items-center gap-2 truncate">
                  <ListMusic className="size-4 shrink-0" aria-hidden /> {pl.name}
                </span>
                <span className="font-mono text-xs text-pearl-faint">{pl.songIds.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {current && <PlaylistEditor key={current.id} pl={current} songs={songs} onDeleted={() => setSelected(null)} />}
    </div>
  )
}

function PlaylistEditor({ pl, songs, onDeleted }: { pl: Playlist; songs: Song[]; onDeleted: () => void }) {
  const navigate = useNavigate()
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const byId = new Map(songs.map((s) => [s.id!, s]))
  // músicas apagadas da biblioteca somem do repertório
  const items = pl.songIds.filter((id) => byId.has(id))
  const available = songs.filter((s) => s.file && !items.includes(s.id!)).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

  const save = (songIds: number[]) => void db.playlists.update(pl.id!, { songIds })
  const drop = (to: number) => {
    if (dragging !== null && dragging !== to) save(moveItem(items, dragging, to))
    setDragging(null)
    setOver(null)
  }

  return (
    <section className="panel p-5 flex flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <input
          defaultValue={pl.name}
          onBlur={(e) => e.target.value.trim() && e.target.value !== pl.name && void db.playlists.update(pl.id!, { name: e.target.value.trim() })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Nome do repertório"
          className="flex-1 min-w-0 bg-transparent font-display text-4xl font-black uppercase outline-none border-b border-transparent focus:border-enclosure"
        />
        <Button disabled={!items.length} onClick={() => navigate(playlistSongUrl({ ...pl, songIds: items }, 0))}>
          <Play className="size-4" aria-hidden /> Estudar em ordem
        </Button>
        {confirming ? (
          <span className="flex gap-1">
            <Button variant="ghost" onClick={() => setConfirming(false)}>Manter</Button>
            <Button variant="secondary" className="text-led-red" onClick={() => void db.playlists.delete(pl.id!).then(onDeleted)}>Apagar repertório</Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)} aria-label="Apagar repertório" title="Apagar repertório">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      <p className="text-sm text-pearl-faint">Arraste pela alça (ou use as setas) para mudar a ordem. "Estudar em ordem" abre a 1ª música; no player, "Próxima" leva à seguinte.</p>

      <ol className="grid gap-1.5">
        {items.map((id, i) => {
          const s = byId.get(id)!
          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                setDragging(i)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(i)
              }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                drop(i)
              }}
              onDragEnd={() => {
                setDragging(null)
                setOver(null)
              }}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${over === i && dragging !== i ? 'border-enclosure bg-enclosure/10' : 'border-wood-700'} ${dragging === i ? 'opacity-50' : ''}`}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-pearl-faint" aria-hidden />
              <span className="w-7 font-mono text-pearl-faint">{i + 1}</span>
              <button className="flex-1 min-w-0 text-left" onClick={() => navigate(playlistSongUrl({ ...pl, songIds: items }, i))}>
                <span className="block truncate font-semibold">{s.title}</span>
                <span className="block truncate text-xs text-pearl-faint">{s.artist || 'Artista desconhecido'}</span>
              </button>
              <Button variant="ghost" className="min-w-11 px-2" disabled={i === 0} onClick={() => save(moveItem(items, i, i - 1))} aria-label={`Subir ${s.title}`}>
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" className="min-w-11 px-2" disabled={i === items.length - 1} onClick={() => save(moveItem(items, i, i + 1))} aria-label={`Descer ${s.title}`}>
                <ArrowDown className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" className="min-w-11 px-2" onClick={() => save(items.filter((x) => x !== id))} aria-label={`Tirar ${s.title} do repertório`} title="Tirar do repertório">
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          )
        })}
      </ol>
      {!items.length && <p className="rounded-xl border border-wood-700/60 bg-wood-950/50 p-4 text-pearl-dim">Repertório vazio: adicione músicas abaixo.</p>}

      <label className="grid gap-1 text-sm max-w-xl">
        <span className="text-pearl-dim">Adicionar música da biblioteca</span>
        <select
          value=""
          onChange={(e) => e.target.value && save([...items, Number(e.target.value)])}
          className="min-h-11 rounded-xl bg-wood-950 border border-wood-700 px-3 text-base text-pearl focus:border-enclosure outline-none"
        >
          <option value="">{available.length ? 'Escolha uma música…' : 'Todas as músicas já estão aqui'}</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}{s.artist ? ` · ${s.artist}` : ''}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
