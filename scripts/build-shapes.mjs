/**
 * Fabrique les silhouettes de pays.
 *
 * Elles ne partent pas dans le navigateur avec leur nom : ce fichier ne
 * sert qu'au semis, qui recopie le tracé dans la question. Un composant qui
 * chercherait « France » dans une table livrerait la réponse à qui ouvre
 * les outils de développement.
 *
 * Chaque pays est ramené dans un carré de 100 sur 100, sa plus grande
 * masse continentale seulement : la Guyane et la Corse ne disent rien de la
 * forme de la France, et les inclure la réduirait à un confetti au milieu
 * de l'image.
 *
 * La longitude est resserrée par le cosinus de la latitude moyenne. Sans
 * cela, la Norvège arriverait deux fois trop large et personne ne la
 * reconnaîtrait.
 *
 * Lancer avec : npm run build:shapes
 */
import { writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import topology from 'world-atlas/countries-110m.json' with { type: 'json' }

/** Ce qu'on garde. Un pays qu'on ne saurait pas nommer n'a rien à faire ici. */
const WANTED = {
  France: ['France'],
  Italy: ['Italie'],
  Spain: ['Espagne'],
  Portugal: ['Portugal'],
  Germany: ['Allemagne'],
  'United Kingdom': ['Royaume-Uni', 'Angleterre', 'Grande-Bretagne'],
  Ireland: ['Irlande'],
  Norway: ['Norvège'],
  Sweden: ['Suède'],
  Finland: ['Finlande'],
  Greece: ['Grèce'],
  Poland: ['Pologne'],
  Switzerland: ['Suisse'],
  Austria: ['Autriche'],
  Netherlands: ['Pays-Bas', 'Hollande'],
  Belgium: ['Belgique'],
  Turkey: ['Turquie'],
  India: ['Inde'],
  Japan: ['Japon'],
  China: ['Chine'],
  Brazil: ['Brésil'],
  Argentina: ['Argentine'],
  Chile: ['Chili'],
  Mexico: ['Mexique'],
  Canada: ['Canada'],
  Australia: ['Australie'],
  'New Zealand': ['Nouvelle-Zélande'],
  Egypt: ['Égypte'],
  Morocco: ['Maroc'],
  Madagascar: ['Madagascar'],
  'South Africa': ['Afrique du Sud'],
  Iceland: ['Islande'],
  Cuba: ['Cuba'],
  Vietnam: ['Viêt Nam', 'Vietnam'],
}

/** Aire d'un anneau, par la formule du lacet. Sert à trouver le continent. */
function area(ring) {
  let sum = 0
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += a[0] * b[1] - b[0] * a[1]
  }
  return Math.abs(sum / 2)
}

function shapeOf(geometry) {
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  // La plus grande masse, et elle seule.
  const rings = polygons.map((polygon) => polygon[0]).filter(Boolean)
  const main = rings.reduce((best, ring) => (area(ring) > area(best) ? ring : best))

  const lats = main.map(([, lat]) => lat)
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const squeeze = Math.cos((midLat * Math.PI) / 180)

  const flat = main.map(([lng, lat]) => [lng * squeeze, -lat])
  const xs = flat.map(([x]) => x)
  const ys = flat.map(([, y]) => y)

  const width = Math.max(...xs) - Math.min(...xs)
  const height = Math.max(...ys) - Math.min(...ys)
  // Soixante-dix, et pas davantage : tournée de quarante-cinq degrés, une
  // forme plus grande sortirait du cadre par les coins.
  const scale = 70 / Math.max(width, height)

  // Centré dans le carré : la forme doit tourner sans jamais en sortir.
  const offsetX = (100 - width * scale) / 2 - Math.min(...xs) * scale
  const offsetY = (100 - height * scale) / 2 - Math.min(...ys) * scale

  const points = flat.map(
    ([x, y]) =>
      `${(x * scale + offsetX).toFixed(1)} ${(y * scale + offsetY).toFixed(1)}`,
  )

  return `M${points.join('L')}Z`
}

const countries = feature(topology, topology.objects.countries)
const entries = []

for (const country of countries.features) {
  const french = WANTED[country.properties?.name]
  if (!french || !country.geometry) continue
  entries.push([french, shapeOf(country.geometry)])
}

const missing = Object.values(WANTED).filter(
  (names) => !entries.some(([kept]) => kept[0] === names[0]),
)
if (missing.length > 0) {
  console.warn(`Introuvables : ${missing.map((names) => names[0]).join(', ')}`)
}

const file = `/**
 * Silhouettes de pays, ramenées dans un carré de 100 sur 100.
 *
 * Fichier engendré par \`npm run build:shapes\`, ne pas modifier à la main.
 * Il ne sert qu'au semis : le tracé est recopié dans la question, jamais le
 * nom du pays, sinon la réponse partirait dans le navigateur.
 *
 * Source : Natural Earth (domaine public), via world-atlas.
 */
export const SHAPES = ${JSON.stringify(
  Object.fromEntries(entries.map(([names, path]) => [names[0], { names, path }])),
  null,
  2,
)}
`

writeFileSync(new URL('../supabase/seed/shapes.mjs', import.meta.url), file)
console.log(`${entries.length} silhouettes, ${Math.round(file.length / 1024)} Ko`)
