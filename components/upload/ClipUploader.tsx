'use client'

import { useCallback, useState } from 'react'
import { DropZone } from '@/components/upload/DropZone'
import { UploadStatus } from '@/components/upload/UploadStatus'
import { Panel } from '@/components/ui'
import { createClipDraft, discardClipDraft } from '@/lib/clips/actions'
import { probeClip, type ClipMetadata } from '@/lib/clips/probe'
import { validateDuration, validateFile } from '@/lib/clips/validate'

type State =
  | { step: 'idle' }
  | { step: 'reading'; file: File }
  | { step: 'uploading'; file: File; meta: ClipMetadata; progress: number }

/**
 * Envoie le fichier directement à Supabase avec l'URL signée obtenue du
 * serveur. On passe par XMLHttpRequest et non `fetch` : c'est la seule API
 * qui expose la progression de l'envoi, et sans progression réelle une
 * attente de 50 Mo paraît un plantage.
 */
function putWithProgress(
  url: string,
  file: File,
  onProgress: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    request.setRequestHeader('Content-Type', file.type || 'video/mp4')

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    })

    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error(`L’envoi a échoué (code ${request.status})`))
    })
    request.addEventListener('error', () =>
      reject(new Error('L’envoi a échoué. Vérifiez votre connexion.')),
    )
    request.addEventListener('abort', () => reject(new Error('Envoi interrompu')))

    request.send(file)
  })
}

export function ClipUploader({
  onUploaded,
}: {
  onUploaded: (clipId: string) => Promise<void> | void
}) {
  const [state, setState] = useState<State>({ step: 'idle' })
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      const formatRejection = validateFile(file)
      if (formatRejection) {
        setError(formatRejection.message)
        return
      }

      setState({ step: 'reading', file })

      let meta: ClipMetadata
      try {
        meta = await probeClip(file)
      } catch {
        setError('Impossible de lire ce fichier. Il est peut-être corrompu.')
        setState({ step: 'idle' })
        return
      }

      const durationRejection = validateDuration(meta.durationSec)
      if (durationRejection) {
        setError(durationRejection.message)
        setState({ step: 'idle' })
        return
      }

      setState({ step: 'uploading', file, meta, progress: 0 })

      let draftId: string | null = null
      try {
        const draft = await createClipDraft({
          title: file.name.replace(/\.mp4$/i, ''),
          durationSec: meta.durationSec,
          width: meta.width,
          height: meta.height,
        })
        draftId = draft.clipId

        await putWithProgress(draft.uploadUrl, file, (progress) => {
          setState((current) =>
            current.step === 'uploading' ? { ...current, progress } : current,
          )
        })

        await onUploaded(draft.clipId)
      } catch (cause) {
        // Sans ce nettoyage, la ligne resterait en base en pointant vers un
        // fichier qui n'a jamais été écrit.
        if (draftId) await discardClipDraft(draftId).catch(() => {})
        setError(cause instanceof Error ? cause.message : 'L’envoi a échoué.')
        setState({ step: 'idle' })
      }
    },
    [onUploaded],
  )

  return (
    <div className="space-y-4">
      {state.step === 'idle' && (
        <DropZone onFile={(file) => void handleFile(file)} />
      )}

      {state.step === 'reading' && (
        <Panel className="text-muted w-full py-10 text-center text-[15px]">
          Lecture du fichier…
        </Panel>
      )}

      {state.step === 'uploading' && (
        <UploadStatus
          name={state.file.name}
          size={state.file.size}
          durationSec={state.meta.durationSec}
          progress={state.progress}
        />
      )}

      {error && (
        <p role="alert" className="text-rec text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
