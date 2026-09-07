import { describe, expect, it } from 'vitest'
import { BotEngine } from './engine'
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from './expressions'
import { SHAPE_BY_ID } from './skins'

const cloud = SHAPE_BY_ID.get('nuage')!.radii
const neutral = EXPRESSION_BY_ID.get(DEFAULT_EXPRESSION)!
const attentive = EXPRESSION_BY_ID.get('attentif')!

describe('visages des presets', () => {
  it('personnalise les silhouettes sans changer le preset idle du montage', () => {
    const circle = SHAPE_BY_ID.get('cercle')!.radii
    const drop = SHAPE_BY_ID.get('goutte')!.radii
    const avatar = new BotEngine(100, 'idle', circle, neutral)
    expect(avatar.sample(1).bodyPath).not.toBe(new BotEngine(100, 'idle', drop, neutral).sample(1).bodyPath)
    const timeline = new BotEngine(100, 'idle', circle, neutral, true)
    expect(timeline.sample(1).bodyPath).toBe(new BotEngine(100, 'idle', drop, neutral, true).sample(1).bodyPath)
    expect(timeline.sample(1).bodyPath).toBe(new BotEngine(100, 'idle', cloud, neutral).sample(1).bodyPath)
    avatar.presetIdle = true
    expect(avatar.sample(1).bodyPath).toBe(timeline.sample(1).bodyPath)
    avatar.presetIdle = false
    expect(avatar.sample(1).bodyPath).not.toBe(timeline.sample(1).bodyPath)
  })
  it('distingue idle du nuage attentif avec le visage par defaut du montage', () => {
    const idle = new BotEngine(100, 'idle', cloud, neutral).sample(1)
    const focused = new BotEngine(100, 'cloudAttentive', cloud, neutral).sample(1)
    expect(idle.eyes).not.toEqual(focused.eyes)
    expect(focused.eyes).toEqual(
      new BotEngine(100, 'cloudAttentive', cloud, attentive).sample(1).eyes
    )
  })

  it('garde idle personnalisable sans contaminer le visage neutre', () => {
    const before = new BotEngine(100, 'idle', cloud, neutral).sample(1)
    const custom = new BotEngine(100, 'idle', cloud, attentive).sample(1)
    new BotEngine(100, 'cloudAttentive', cloud, neutral).sample(1)
    expect(custom.eyes).not.toEqual(before.eyes)
    expect(new BotEngine(100, 'idle', cloud, neutral).sample(1).eyes).toEqual(before.eyes)
  })
})
