import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../progress/settings'
import { input, type InputListener } from './engine'
import type { PitchReading } from './pitch'

export type InputStatus = 'off' | 'starting' | 'on' | 'denied' | 'error'

/** Liga a entrada de áudio enquanto o componente estiver montado e `enabled`. */
export function useAudioInput(enabled: boolean, listener: InputListener = {}) {
  const deviceId = useSettings((s) => s.inputDeviceId)
  const sensitivity = useSettings((s) => s.sensitivity)
  const [status, setStatus] = useState<InputStatus>('starting')
  const [reading, setReading] = useState<PitchReading | null>(null)
  const [level, setLevel] = useState(0)
  const ref = useRef(listener)
  useEffect(() => {
    ref.current = listener
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    input.setSensitivity(sensitivity)
    input
      .start(deviceId)
      .then(() => !cancelled && setStatus('on'))
      .catch((e: Error) => !cancelled && setStatus(e.name === 'NotAllowedError' ? 'denied' : 'error'))
    let frame = 0
    const unsub = input.subscribe({
      onReading: (r, l) => {
        // atualiza a interface a ~20 fps para não sobrecarregar o React
        if (++frame % 3 === 0) {
          setReading(r)
          setLevel(l)
        }
        ref.current.onReading?.(r, l)
      },
      onNote: (m, t) => ref.current.onNote?.(m, t),
      onOnset: (t) => ref.current.onOnset?.(t),
    })
    return () => {
      cancelled = true
      unsub()
      input.stop()
      setStatus('starting')
    }
  }, [enabled, deviceId, sensitivity])

  return { status: enabled ? status : ('off' as InputStatus), reading, level }
}
