import { EXPRESSION_BY_ID } from './expressions'
import {
  COLOR_BY_ID,
  SHAPE_BY_ID,
  isGradient,
  isGradientType,
  normalizeHex,
  type GradientType,
} from './skins'
import { SEQUENCE, type StateId } from './states'

export interface AnimationAppearance {
  shape?: string
  color?: string
  gradient?: string
  gradientType?: GradientType
  gradientAngle?: number
  expression?: string
}

export type AnimationAppearances = Partial<Record<StateId, AnimationAppearance>>

const ANIMATION_IDS = new Set<StateId>(SEQUENCE)

export function animationShape(
  state: StateId,
  fallback: string,
  appearances: AnimationAppearances,
): string {
  return appearances[state]?.shape ?? fallback
}

export function animationColor(
  state: StateId,
  fallback: string,
  appearances: AnimationAppearances,
): string {
  return appearances[state]?.color ?? fallback
}

export function animationExpression(
  state: StateId,
  fallback: string,
  appearances: AnimationAppearances,
): string {
  return appearances[state]?.expression ?? fallback
}

export function animationGradient(
  state: StateId,
  fallback: string,
  appearances: AnimationAppearances,
): string {
  return appearances[state]?.gradient ?? (appearances[state]?.color ? 'none' : fallback)
}

export function animationGradientType(
  state: StateId,
  fallback: GradientType,
  appearances: AnimationAppearances,
): GradientType {
  return appearances[state]?.gradientType ?? fallback
}

export function animationGradientAngle(
  state: StateId,
  fallback: number,
  appearances: AnimationAppearances,
): number {
  return appearances[state]?.gradientAngle ?? fallback
}

export function parseAnimationAppearances(raw: string | null): AnimationAppearances {
  if (!raw) return {}

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

    const appearances: AnimationAppearances = {}
    for (const [key, entry] of Object.entries(value)) {
      const state = key as StateId
      if (!ANIMATION_IDS.has(state)) continue
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue

      const candidate = entry as AnimationAppearance
      const appearance: AnimationAppearance = {}
      if (typeof candidate.shape === 'string' && SHAPE_BY_ID.has(candidate.shape)) {
        appearance.shape = candidate.shape
      }
      if (
        typeof candidate.color === 'string' &&
        (COLOR_BY_ID.has(candidate.color) || normalizeHex(candidate.color))
      ) {
        appearance.color = candidate.color
      }
      if (typeof candidate.gradient === 'string' && isGradient(candidate.gradient)) {
        appearance.gradient = candidate.gradient
      }
      if (typeof candidate.gradientType === 'string' && isGradientType(candidate.gradientType)) {
        appearance.gradientType = candidate.gradientType
      }
      if (
        typeof candidate.gradientAngle === 'number' &&
        Number.isFinite(candidate.gradientAngle) &&
        candidate.gradientAngle >= 0 &&
        candidate.gradientAngle <= 360
      ) {
        appearance.gradientAngle = candidate.gradientAngle
      }
      if (
        typeof candidate.expression === 'string' &&
        EXPRESSION_BY_ID.has(candidate.expression)
      ) {
        appearance.expression = candidate.expression
      }
      if (Object.keys(appearance).length) appearances[state] = appearance
    }
    return appearances
  } catch {
    return {}
  }
}

export function setAnimationShape(
  appearances: AnimationAppearances,
  state: StateId,
  shape: string,
): AnimationAppearances {
  if (!ANIMATION_IDS.has(state) || !SHAPE_BY_ID.has(shape)) return appearances
  return { ...appearances, [state]: { ...appearances[state], shape } }
}

export function setAnimationColor(
  appearances: AnimationAppearances,
  state: StateId,
  color: string,
): AnimationAppearances {
  if (!ANIMATION_IDS.has(state) || (!COLOR_BY_ID.has(color) && !normalizeHex(color))) {
    return appearances
  }
  return { ...appearances, [state]: { ...appearances[state], color, gradient: 'none' } }
}

export function setAnimationGradient(
  appearances: AnimationAppearances,
  state: StateId,
  gradient: string,
): AnimationAppearances {
  if (!ANIMATION_IDS.has(state) || !isGradient(gradient)) return appearances
  return { ...appearances, [state]: { ...appearances[state], gradient } }
}

export function setAnimationGradientType(
  appearances: AnimationAppearances,
  state: StateId,
  gradientType: GradientType,
): AnimationAppearances {
  if (!ANIMATION_IDS.has(state) || !isGradientType(gradientType)) return appearances
  return { ...appearances, [state]: { ...appearances[state], gradientType } }
}

export function setAnimationGradientAngle(
  appearances: AnimationAppearances,
  state: StateId,
  gradientAngle: number,
): AnimationAppearances {
  if (
    !ANIMATION_IDS.has(state) ||
    !Number.isFinite(gradientAngle) ||
    gradientAngle < 0 ||
    gradientAngle > 360
  ) return appearances
  return { ...appearances, [state]: { ...appearances[state], gradientAngle } }
}

export function setAnimationExpression(
  appearances: AnimationAppearances,
  state: StateId,
  expression: string,
): AnimationAppearances {
  if (!ANIMATION_IDS.has(state) || !EXPRESSION_BY_ID.has(expression)) return appearances
  return { ...appearances, [state]: { ...appearances[state], expression } }
}

export function resetAnimationAppearance(
  appearances: AnimationAppearances,
  state: StateId,
): AnimationAppearances {
  if (!appearances[state]) return appearances
  const next = { ...appearances }
  delete next[state]
  return next
}
