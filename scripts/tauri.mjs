// Roda o CLI do Tauri com o Rust (~/.cargo/bin) no PATH, no Mac e no Windows.
// (os scripts antigos usavam PATH=... tauri, sintaxe que só funciona em shell Unix)
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'

const env = { ...process.env }
const key = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH'
env[key] = [join(homedir(), '.cargo', 'bin'), env[key]].filter(Boolean).join(delimiter)

// atualizações assinadas: a chave privada fica fora do repositório (no CI vem dos segredos do GitHub)
const keyFile = join(homedir(), '.tauri', 'fretlab.key')
if (!env.TAURI_SIGNING_PRIVATE_KEY && existsSync(keyFile)) {
  env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyFile, 'utf8')
  env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ??= ''
}

const child = spawn('npx', ['tauri', ...process.argv.slice(2)], { stdio: 'inherit', env, shell: process.platform === 'win32' })
child.on('exit', (code) => process.exit(code ?? 1))
