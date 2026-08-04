import { describe, expect, it } from 'vitest'
import { cuesFor, type Track } from './mixer'

const track = (id: string, startSec: number, durationSec: number, offsetMs = 0): Track => ({
  id,
  startSec,
  durationSec,
  offsetMs,
})

describe('cuesFor', () => {
  it('programme une prise à venir avec son délai', () => {
    const [cue] = cuesFor([track('a', 8, 2)], 5)
    expect(cue).toEqual({ id: 'a', delaySec: 3, seekSec: 0 })
  })

  it('démarre aussitôt, en plein milieu, une prise déjà commencée', () => {
    // La lecture reprend a 6 s dans une prise qui court de 5 a 9 s.
    const [cue] = cuesFor([track('a', 5, 4)], 6)
    expect(cue).toEqual({ id: 'a', delaySec: 0, seekSec: 1 })
  })

  it('ignore une prise déjà terminée', () => {
    expect(cuesFor([track('a', 1, 2)], 5)).toEqual([])
  })

  it('ignore une prise qui finit pile au point de départ', () => {
    expect(cuesFor([track('a', 3, 2)], 5)).toEqual([])
  })

  it('garde une prise qui commence pile au point de départ', () => {
    const [cue] = cuesFor([track('a', 5, 2)], 5)
    expect(cue).toMatchObject({ delaySec: 0, seekSec: 0 })
  })

  it('applique la correction de latence', () => {
    // Mesuree a 120 ms : la prise est ancree d'autant plus loin.
    const [cue] = cuesFor([track('a', 8, 2, 120)], 5)
    expect(cue?.delaySec).toBeCloseTo(3.12, 5)
  })

  it('rend les déclenchements dans l’ordre du temps', () => {
    const cues = cuesFor([track('c', 9, 1), track('a', 6, 1), track('b', 7, 1)], 5)
    expect(cues.map((cue) => cue.id)).toEqual(['a', 'b', 'c'])
  })

  it('laisse passer plusieurs prises qui se superposent', () => {
    // Deux joueurs sur le meme passage : les deux doivent sonner.
    const cues = cuesFor([track('a', 5, 3), track('b', 6, 3)], 5)
    expect(cues).toHaveLength(2)
  })

  it('ne rend rien depuis la fin du clip', () => {
    expect(cuesFor([track('a', 2, 1), track('b', 5, 1)], 99)).toEqual([])
  })

  it('gère l’absence de prises', () => {
    expect(cuesFor([], 0)).toEqual([])
  })
})
