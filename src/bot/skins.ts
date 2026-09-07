import { PROFILE_SAMPLES } from './profiles'
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile
} from './shape'

/**
 * Formes et couleurs proposees par le personnalisateur du bot.
 *
 * A la difference des silhouettes d'animation (`profiles.ts`), celles-ci ne sont
 * PAS relevees sur la video : elles sont construites analytiquement d'apres la
 * grille du personnalisateur d'origine. Deux sources distinctes, donc, et c'est
 * volontaire — les etats animes doivent rester fideles a la video, les formes de
 * base sont un choix d'utilisateur.
 */

/**
 * Les identifiants sont enumeres plutot que deduits du tableau : c'est ce qui
 * permet a la couche i18n de verifier A LA COMPILATION que chaque forme a bien
 * sa traduction dans les trois langues (`t(\`shapes.${id}\`)` ne compile que si
 * la cle existe). Un `as const` sur le tableau aurait le meme effet mais
 * rendrait `radii` en lecture seule, alors que le moteur le passe tel quel.
 */
export type ShapeId =
  | 'cercle'
  | 'galet'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagone'
  | 'nuage'
  | 'goutte'

export interface BotShape {
  id: ShapeId
  radii: number[]
}

/** Ramene le rayon maximal a `max` pour que toutes les formes pesent pareil a l'oeil. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Galet : cercle deforme par deux harmoniques basses, donc irregulier mais lisse. */
const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02
)

/** Nuage : union de bosses, large en bas, deux lobes en haut. */
const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 }
  ]),
  1.02
)

/** Goutte : gros disque en bas, pointe effilee en haut. */
const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04
)

/** Capsule couchee : enveloppe de deux disques cote a cote. */
const capsule = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62), 0, 0)

export const SHAPES: BotShape[] = [
  { id: 'cercle', radii: new Array(PROFILE_SAMPLES).fill(1) },
  { id: 'galet', radii: pebble },
  // 1.15 et pas 1.02 : sur une superellipse le rayon maximal est la diagonale,
  // donc normaliser dessus donne une forme qui parait plus petite que le cercle.
  { id: 'squircle', radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  // -90deg : un sommet vers le haut de l'ecran (y est oriente vers le bas)
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg : sommets a gauche et a droite, donc aretes du haut et du bas plates
  { id: 'hexagone', radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: 'nuage', radii: cloud },
  { id: 'goutte', radii: droplet }
]

// Map indexee par `string` et non par `ShapeId` : les appelants interrogent avec
// une valeur relue du localStorage ou d'une prop, donc non validee.
export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'cercle'

export type ColorId =
  | 'encre'
  | 'creme'
  | 'brun'
  | 'rouge'
  | 'orange'
  | 'ambre'
  | 'vert'
  | 'turquoise'
  | 'bleu'
  | 'violet'
  | 'rose'
  | 'gris'

export interface BotColor {
  id: ColorId
  hex: string
}

/** Palette du personnalisateur d'origine. */
export const COLORS: BotColor[] = [
  { id: 'encre', hex: '#0a0a0c' },
  { id: 'brun', hex: '#8b5e3c' },
  { id: 'rouge', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'ambre', hex: '#f0b429' },
  { id: 'vert', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'bleu', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'rose', hex: '#e152b0' },
  { id: 'gris', hex: '#a3a3a3' },
  { id: 'creme', hex: '#f1efe9' }
]

export const COLOR_BY_ID = new Map<string, BotColor>(COLORS.map((c) => [c.id, c]))
export const DEFAULT_COLOR = 'encre'

/** Accepte aussi une saisie sans `#` et la notation courte, puis stocke toujours #rrggbb. */
export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw].map((c) => c + c).join('').toLowerCase()}`
  }
  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : null
}

export function resolveColor(value: string): string {
  return COLOR_BY_ID.get(value)?.hex ?? normalizeHex(value) ?? '#0a0a0c'
}

export type GradientId = 'none' | 'sunset' | 'ocean' | 'aurora' | 'candy' | 'twilight'

export interface BotGradient {
  id: GradientId
  /** Couleurs dans l'ordre du coin haut-gauche au coin bas-droit. */
  stops: string[]
  positions?: number[]
}

/** Degrades courts et francs : ils restent lisibles jusque dans les petites vignettes. */
export const GRADIENTS: BotGradient[] = [
  { id: 'sunset', stops: ['#ff5f6d', '#ffc371'] },
  { id: 'ocean', stops: ['#2563eb', '#22d3ee'] },
  { id: 'aurora', stops: ['#10b981', '#a3e635'] },
  { id: 'candy', stops: ['#ec4899', '#8b5cf6'] },
  { id: 'twilight', stops: ['#312e81', '#c026d3', '#fb7185'] }
]

export const GRADIENT_BY_ID = new Map<string, BotGradient>(GRADIENTS.map((g) => [g.id, g]))
export const DEFAULT_GRADIENT: GradientId = 'none'

export type GradientType = 'linear' | 'radial'
export const DEFAULT_GRADIENT_TYPE: GradientType = 'linear'

export function isGradientType(value: string): value is GradientType {
  return value === 'linear' || value === 'radial'
}

const CUSTOM_GRADIENT = /^custom:(#[0-9a-f]{6}):(#[0-9a-f]{6})$/i

export interface GradientStop { color: string; position: number }

export function positionedGradient(stops: GradientStop[]): string {
  return `stops:${stops.map((s) => `${s.color}@${s.position}`).join(':')}`
}

export function gradientAnchors(value: string): GradientStop[] {
  const gradient = resolveGradient(value)
  return gradient?.stops.map((color, i) => ({ color, position: gradient.positions?.[i] ?? i * 100 / (gradient.stops.length - 1) })) ?? []
}

export function customGradient(from: string, to: string): string {
  return `custom:${normalizeHex(from) ?? '#2563eb'}:${normalizeHex(to) ?? '#22d3ee'}`
}

/** Resout aussi le degrade libre encode dans le stockage, sans accepter du CSS arbitraire. */
export function resolveGradient(value: string): BotGradient | undefined {
  const preset = GRADIENT_BY_ID.get(value)
  if (preset) return preset
  if (value.startsWith('stops:')) {
    const parts = value.slice(6).split(':')
    if (parts.length < 2 || parts.length > 20) return undefined
    const anchors: GradientStop[] = []
    for (const part of parts) {
      const match = /^(#[0-9a-f]{6})@(\d+(?:\.\d+)?)$/i.exec(part)
      if (!match || Number(match[2]) > 100) return undefined
      anchors.push({ color: match[1]!.toLowerCase(), position: Number(match[2]) })
    }
    anchors.sort((a, b) => a.position - b.position)
    return { id: 'none', stops: anchors.map(s => s.color), positions: anchors.map(s => s.position) }
  }
  const match = value.match(CUSTOM_GRADIENT)
  return match
    ? { id: 'none', stops: [match[1]!.toLowerCase(), match[2]!.toLowerCase()] }
    : undefined
}

export function isGradient(value: string): boolean {
  return value === 'none' || Boolean(resolveGradient(value))
}

/** Melange deux couleurs hex. Sert a la brume de profondeur des particules. */
export function mixHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const v = parseInt(h.slice(1), 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  }
  const a = parse(from)
  const b = parse(to)
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t))
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}
