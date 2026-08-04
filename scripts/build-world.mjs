/**
 * Fabrique la carte du monde une fois pour toutes.
 *
 * Les questions de placement ont besoin d'un fond de carte, et une carte en
 * ligne coûterait une clé d'API, un quota et une dépendance réseau : trois
 * choses que ce projet s'interdit. On convertit donc le fond libre de
 * Natural Earth en chemins SVG, livrés avec le code.
 *
 * Le repère choisi est la longitude et la latitude elles-mêmes : `x` vaut
 * la longitude, `y` vaut l'opposé de la latitude. Cadrer sur l'Europe ne
 * demande alors qu'un `viewBox`, et un clic se relit en coordonnées sans
 * la moindre conversion.
 *
 * Lancer avec : npm run build:world
 */
import { writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import topology from 'world-atlas/countries-110m.json' with { type: 'json' }

/** Un dixième de degré : environ onze kilomètres, invisible à l'écran. */
const PRECISION = 1

const round = (value) => Number(value.toFixed(PRECISION))

/**
 * Coupe un contour au 180ᵉ méridien.
 *
 * La Russie, les Fidji et l'Antarctique passent d'un bord à l'autre de la
 * carte. En longitude brute, aller de 179 à -179 trace un trait droit qui
 * traverse tout le planisphère : trois bandes en travers de l'image. On
 * coupe donc le contour à chaque saut, en le prolongeant jusqu'au bord
 * pour que la découpe tombe pile sur la bordure.
 */
function cutAtAntimeridian(ring) {
  const runs = []
  let run = []
  let previous = null

  for (const point of ring) {
    if (previous && Math.abs(point[0] - previous[0]) > 180) {
      const edge = previous[0] > 0 ? 180 : -180
      // La latitude du croisement, prise sur la route la plus courte.
      const wrapped = point[0] + (point[0] < previous[0] ? 360 : -360)
      const part = (edge - previous[0]) / (wrapped - previous[0])
      const lat = previous[1] + part * (point[1] - previous[1])

      run.push([edge, lat])
      runs.push(run)
      run = [[-edge, lat]]
    }
    run.push(point)
    previous = point
  }

  runs.push(run)
  return runs
}

function runToPath(run) {
  const points = []
  let last = null

  for (const [lng, lat] of run) {
    const x = round(lng)
    const y = round(-lat)
    // Deux points identiques après arrondi n'ajoutent que du poids.
    if (last && last[0] === x && last[1] === y) continue
    last = [x, y]
    points.push(`${x} ${y}`)
  }

  if (points.length < 3) return ''

  // Les îlots plus petits qu'un demi-degré ne pèsent qu'à l'échelle du
  // fichier : à l'écran, ils tiennent dans l'épaisseur d'un trait.
  const xs = points.map((point) => Number(point.split(' ')[0]))
  const ys = points.map((point) => Number(point.split(' ')[1]))
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  if (span < 0.5) return ''

  return `M${points.join('L')}Z`
}

function ringToPath(ring) {
  return cutAtAntimeridian(ring).map(runToPath).filter(Boolean).join('')
}

const countries = feature(topology, topology.objects.countries)
const paths = []

for (const country of countries.features) {
  const geometry = country.geometry
  if (!geometry) continue

  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  const drawn = polygons
    .flatMap((polygon) => polygon.map(ringToPath))
    .filter(Boolean)
    .join('')

  if (drawn) paths.push(drawn)
}

const file = `/**
 * Fond de carte du monde, en degrés.
 *
 * Fichier engendré par \`npm run build:world\`, ne pas modifier à la main.
 * Chaque chaîne est un pays : \`x\` est la longitude, \`y\` l'opposé de la
 * latitude, si bien qu'un \`viewBox\` suffit à cadrer une région et qu'un
 * clic se relit directement en coordonnées.
 *
 * Source : Natural Earth (domaine public), via world-atlas.
 */
export const WORLD_PATHS: string[] = ${JSON.stringify(paths, null, 0)
  .replace(/","/g, '",\n  "')
  .replace(/^\["/, '[\n  "')
  .replace(/"\]$/, '",\n]')}
`

writeFileSync(new URL('../src/lib/quiz/world.ts', import.meta.url), file)
console.log(`${paths.length} pays, ${Math.round(file.length / 1024)} Ko`)
