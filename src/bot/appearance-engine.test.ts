import { describe, expect, it } from 'vitest'
import { BotEngine } from './engine'
import { EXPRESSION_BY_ID } from './expressions'
import { SHAPE_BY_ID } from './skins'

describe('forced animation appearance', () => {
  it('replaces a silhouette that is fixed by default', () => {
    const circle = SHAPE_BY_ID.get('cercle')!.radii
    const original = new BotEngine(100, 'egg', circle).sample(1).bodyPath
    const customized = new BotEngine(100, 'egg', circle)
    customized.setShape(circle, 0, true)
    expect(customized.sample(1).bodyPath).not.toBe(original)
  })

  it('replaces a face that is fixed by default', () => {
    const happy = EXPRESSION_BY_ID.get('heureux')!
    const original = new BotEngine(100, 'wink', null, happy).sample(1).eyes
    const customized = new BotEngine(100, 'wink', null, happy)
    customized.setExpression(happy, 0, true)
    expect(customized.sample(1).eyes).not.toEqual(original)
  })
})
