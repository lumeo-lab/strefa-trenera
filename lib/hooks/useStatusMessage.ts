import { useCallback, useState } from 'react'

type Tone = 'success' | 'error'

interface StatusMsg {
  tone: Tone
  text: string
}

export function useStatusMessage() {
  const [statusMessage, setStatusMessage] = useState<StatusMsg | null>(null)

  const showStatus = useCallback((tone: Tone, text: string) => {
    setStatusMessage({ tone, text })
  }, [])

  const clearStatus = useCallback(() => {
    setStatusMessage(null)
  }, [])

  return { statusMessage, showStatus, clearStatus } as const
}
