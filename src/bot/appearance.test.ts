import { describe, expect, it } from 'vitest'
import {
  animationColor,
  animationExpression,
  animationGradient,
  animationGradientAngle,
  animationGradientType,
  animationShape,
  parseAnimationAppearances,
  resetAnimationAppearance,
  setAnimationColor,
  setAnimationExpression,
  setAnimationGradient,
  setAnimationGradientAngle,
  setAnimationGradientType,
  setAnimationShape,
} from './appearance'

describe('animation appearances', () => {
  it('uses the global shape when an animation has no override', () => {
    expect(animationShape('idle', 'cercle', {})).toBe('cercle')
  })

  it('stores and resets a shape for a body-based animation', () => {
    const customized = setAnimationShape({}, 'idle', 'galet')
    expect(animationShape('idle', 'cercle', customized)).toBe('galet')
    expect(resetAnimationAppearance(customized, 'idle')).toEqual({})
  })

  it('accepts shapes on animations that used to have a fixed silhouette', () => {
    expect(setAnimationShape({}, 'idle', 'missing')).toEqual({})
    expect(setAnimationShape({}, 'egg', 'galet')).toEqual({ egg: { shape: 'galet' } })
  })

  it('stores colour and expression overrides', () => {
    const colored = setAnimationColor({}, 'burst', '#ff00aa')
    const customized = setAnimationExpression(colored, 'burst', 'heureux')
    expect(animationColor('burst', 'encre', customized)).toBe('#ff00aa')
    expect(animationExpression('burst', 'neutre', customized)).toBe('heureux')
    expect(animationGradient('burst', 'ocean', customized)).toBe('none')
  })

  it('stores a per-animation gradient, geometry and angle', () => {
    let customized = setAnimationGradient({}, 'thinking', 'ocean')
    customized = setAnimationGradientType(customized, 'thinking', 'radial')
    customized = setAnimationGradientAngle(customized, 'thinking', 42)
    expect(animationGradient('thinking', 'none', customized)).toBe('ocean')
    expect(animationGradientType('thinking', 'linear', customized)).toBe('radial')
    expect(animationGradientAngle('thinking', 135, customized)).toBe(42)
  })

  it('only restores valid entries', () => {
    const parsed = parseAnimationAppearances(
      JSON.stringify({
        idle: { shape: 'galet', color: 'rouge', gradient: 'ocean', gradientType: 'radial', gradientAngle: 42, expression: 'heureux' },
        egg: { shape: 'galet' },
        missing: { shape: 'cercle' },
        bounce: { shape: 'missing', color: 'invalid', expression: 'invalid' },
      }),
    )
    expect(parsed).toEqual({
      idle: { shape: 'galet', color: 'rouge', gradient: 'ocean', gradientType: 'radial', gradientAngle: 42, expression: 'heureux' },
      egg: { shape: 'galet' },
    })
    expect(parseAnimationAppearances('{')).toEqual({})
  })
})
