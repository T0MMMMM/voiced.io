'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Panel } from '@/components/ui'
import { createRoom } from '@/lib/rooms/actions'
import { DropZone } from '@/components/upload/DropZone'
import { UploadStatus } from '@/components/upload/UploadStatus'
import { createClipDraft, discardClipDraft } from '@/lib/clips/actions'
import { probeClip, type ClipMetadata } from '@/lib/clips/probe'
import { validateDuration, validateFile } from '@/lib/clips/validate'

type State =
  | { step: 'idle' }
  | { step: 'reading'; file: File }
  | { step: 'uploading'; file: File; meta: ClipMetadata; progress: number }
  | { step: 'ready'; file: File; meta: ClipMetadata; clipId: string }

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

export default function CreatePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [creating, setCreating] = useState(false)
  const [state, setState] = useState<State>({ step: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Une URL d'objet non révoquée retient le fichier entier en mémoire.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFile = useCallback(async (file: File) => {
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

      setPreviewUrl(URL.createObjectURL(file))
      setState({ step: 'ready', file, meta, clipId: draft.clipId })
    } catch (cause) {
      // Sans ce nettoyage, la ligne resterait en base en pointant vers un
      // fichier qui n'a jamais été écrit.
      if (draftId) await discardClipDraft(draftId).catch(() => {})
      setError(cause instanceof Error ? cause.message : 'L’envoi a échoué.')
      setState({ step: 'idle' })
    }
  }, [])

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setError(null)
    setState({ step: 'idle' })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10 sm:pt-40">
      <p className="eyebrow text-faint">Étape 1 sur 3</p>
      <h1 className="text-fg mt-3 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.035em]">
        Importez votre clip.
      </h1>
      <p className="text-muted mt-4 max-w-lg text-[17px] leading-relaxed">
        Une scène courte fonctionne mieux qu’un épisode entier. Le fichier
        reste disponible sept jours, puis il est supprimé.
      </p>

      <div className="mt-12">
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

        {state.step === 'ready' && previewUrl && (
          <div className="space-y-6">
            <Panel className="flex justify-center">
              <video
                src={previewUrl}
                controls
                style={{
                  aspectRatio: state.meta.width / state.meta.height || 16 / 9,
                  maxHeight: '58vh',
                }}
                className="rounded-token bg-playhead max-w-full"
              />
            </Panel>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p className="text-fg text-[15px] font-medium">{state.file.name}</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                Changer de clip
              </Button>
            </div>

            <Panel className="space-y-4">
              <div>
                <h2 className="text-fg text-[15px] font-medium">Ouvrir le salon</h2>
                <p className="text-muted mt-1 text-[15px]">
                  Vous recevrez un code à quatre lettres à donner à vos amis.
                </p>
              </div>

              <Input
                label="Votre pseudo"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Tom"
                maxLength={20}
              />

              <Button
                fullWidth
                loading={creating}
                disabled={nickname.trim().length === 0}
                onClick={() => {
                  setCreating(true)
                  setError(null)
                  createRoom({ game: 'dub', nickname, clipId: state.clipId })
                    .then((room) => router.push(`/room/${room.code}`))
                    .catch((cause: unknown) => {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : 'Impossible de créer le salon.',
                      )
                      setCreating(false)
                    })
                }}
              >
                Créer le salon
              </Button>
            </Panel>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-rec mt-6 text-[15px]">
          {error}
        </p>
      )}
    </main>
  )
}
