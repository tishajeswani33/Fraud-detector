import { useState, useCallback } from 'react'
import { predictText, type PredictResponse } from '../api/fraudApi'

export type PredictState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PredictResponse }
  | { status: 'error'; message: string }

export function usePredict() {
  const [state, setState] = useState<PredictState>({ status: 'idle' })

  const predict = useCallback(async (text: string) => {
    setState({ status: 'loading' })
    try {
      const data = await predictText(text)
      setState({ status: 'success', data })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setState({ status: 'error', message })
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, predict, reset }
}
