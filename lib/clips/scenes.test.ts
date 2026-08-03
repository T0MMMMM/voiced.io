import { describe, expect, it } from 'vitest'
import {
  addMarker,
  canAddMarker,
  MAX_SCENES,
  MIN_SCENE_SEC,
  markersToScenes,
  moveMarker,
  removeMarker,
} from './scenes'

const DURATION = 20

describe('markersToScenes', () => {
  it('sans marqueur, le clip entier forme une seule scene', () => {
    expect(markersToScenes([], DURATION)).toEqual([
      { index: 0, start: 0, end: 20 },
    ])
  })

  it('un marqueur coupe le clip en deux', () => {
    expect(markersToScenes([8], DURATION)).toEqual([
      { index: 0, start: 0, end: 8 },
      { index: 1, start: 8, end: 20 },
    ])
  })

  it('les scenes se touchent bord a bord, sans trou', () => {
    const scenes = markersToScenes([5, 12], DURATION)
    expect(scenes).toHaveLength(3)
    expect(scenes[0]?.end).toBe(scenes[1]?.start)
    expect(scenes[1]?.end).toBe(scenes[2]?.start)
    expect(scenes.at(-1)?.end).toBe(DURATION)
  })

  it('ordonne des marqueurs donnes en desordre', () => {
    expect(markersToScenes([12, 5], DURATION)).toEqual(
      markersToScenes([5, 12], DURATION),
    )
  })

  it('ignore les marqueurs en double', () => {
    expect(markersToScenes([5, 5], DURATION)).toHaveLength(2)
  })

  it('numerote les scenes a partir de zero, sans trou', () => {
    const scenes = markersToScenes([4, 9, 14], DURATION)
    expect(scenes.map((scene) => scene.index)).toEqual([0, 1, 2, 3])
  })
})

describe('canAddMarker', () => {
  it('accepte un marqueur au milieu du clip', () => {
    expect(canAddMarker([], 10, DURATION)).toBe(true)
  })

  it('refuse un marqueur sur les bords', () => {
    expect(canAddMarker([], 0, DURATION)).toBe(false)
    expect(canAddMarker([], DURATION, DURATION)).toBe(false)
  })

  it('refuse un marqueur hors du clip', () => {
    expect(canAddMarker([], -1, DURATION)).toBe(false)
    expect(canAddMarker([], DURATION + 1, DURATION)).toBe(false)
  })

  it('refuse une scene plus courte que la duree minimale', () => {
    // Trop pres du debut : la premiere scene serait inexploitable.
    expect(canAddMarker([], MIN_SCENE_SEC / 2, DURATION)).toBe(false)
    // Trop pres de la fin.
    expect(canAddMarker([], DURATION - MIN_SCENE_SEC / 2, DURATION)).toBe(false)
    // Trop pres d'un marqueur existant.
    expect(canAddMarker([10], 10.2, DURATION)).toBe(false)
  })

  it('accepte un marqueur exactement a la distance minimale', () => {
    expect(canAddMarker([10], 10 + MIN_SCENE_SEC, DURATION)).toBe(true)
  })

  it('refuse de depasser le nombre maximal de scenes', () => {
    // MAX_SCENES scenes demandent MAX_SCENES - 1 marqueurs.
    const full = Array.from({ length: MAX_SCENES - 1 }, (_, i) => (i + 1) * 0.6)
    expect(markersToScenes(full, DURATION)).toHaveLength(MAX_SCENES)
    expect(canAddMarker(full, 18, DURATION)).toBe(false)
  })
})

describe('addMarker', () => {
  it('ajoute et trie', () => {
    expect(addMarker([10], 5, DURATION)).toEqual([5, 10])
  })

  it('ne fait rien si le marqueur est invalide', () => {
    const markers = [10]
    expect(addMarker(markers, 10.1, DURATION)).toEqual([10])
  })

  it('ne modifie pas le tableau d’origine', () => {
    const markers = [10]
    addMarker(markers, 5, DURATION)
    expect(markers).toEqual([10])
  })
})

describe('removeMarker', () => {
  it('retire le marqueur demande', () => {
    expect(removeMarker([4, 9, 14], 1)).toEqual([4, 14])
  })

  it('ignore un index hors limites', () => {
    expect(removeMarker([4, 9], 5)).toEqual([4, 9])
  })
})

describe('moveMarker', () => {
  it('deplace un marqueur isole', () => {
    expect(moveMarker([10], 0, 6, DURATION)).toEqual([6])
  })

  it('bloque le marqueur avant son voisin de gauche', () => {
    const moved = moveMarker([5, 10], 1, 5.1, DURATION)
    expect(moved[1]).toBeCloseTo(5 + MIN_SCENE_SEC, 5)
  })

  it('bloque le marqueur apres son voisin de droite', () => {
    const moved = moveMarker([5, 10], 0, 9.9, DURATION)
    expect(moved[0]).toBeCloseTo(10 - MIN_SCENE_SEC, 5)
  })

  it('bloque le marqueur aux bords du clip', () => {
    expect(moveMarker([10], 0, -5, DURATION)[0]).toBeCloseTo(MIN_SCENE_SEC, 5)
    expect(moveMarker([10], 0, 99, DURATION)[0]).toBeCloseTo(
      DURATION - MIN_SCENE_SEC,
      5,
    )
  })

  it('conserve l’ordre du tableau', () => {
    expect(moveMarker([5, 10, 15], 1, 12, DURATION)).toEqual([5, 12, 15])
  })
})
