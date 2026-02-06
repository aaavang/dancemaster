import { describe, it, expect, beforeEach } from 'vitest'
import { PositionManager } from '../../src/moves/utils'
import { Formations, Positions } from '../../src/enums'

describe('PositionManager', () => {
  let pm: PositionManager

  beforeEach(() => {
    pm = new PositionManager()
    pm.recalculate(1000, 800)
  })

  it('recalculate() computes center at true midpoint', () => {
    expect(pm.center).toEqual({ x: 500, y: 400 })
  })

  it('get() returns correct position for FIRST_TOP_LEAD', () => {
    const sf = pm.scaleFactor
    const center = pm.center
    const pos = pm.get(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_TOP_LEAD)
    expect(pos).toEqual({ x: center.x + 25 * sf, y: center.y - 250 * sf, rotation: 0 })
  })

  it('all 8 EIGHT_HAND_SQUARE positions have correct offsets from center', () => {
    const center = pm.center
    const sf = pm.scaleFactor
    const f = Formations.EIGHT_HAND_SQUARE
    const positions = {
      [Positions.FIRST_TOP_FOLLOW]:  { dx: -125, dy: -250, rotation: 0 },
      [Positions.FIRST_TOP_LEAD]:    { dx: 25,   dy: -250, rotation: 0 },
      [Positions.SECOND_TOP_FOLLOW]: { dx: 25,   dy: 150,  rotation: 180 },
      [Positions.SECOND_TOP_LEAD]:   { dx: -125, dy: 150,  rotation: 180 },
      [Positions.FIRST_SIDE_LEAD]:   { dx: 150,  dy: 25,   rotation: 90 },
      [Positions.FIRST_SIDE_FOLLOW]: { dx: 150,  dy: -125, rotation: 90 },
      [Positions.SECOND_SIDE_LEAD]:  { dx: -250, dy: -125, rotation: 270 },
      [Positions.SECOND_SIDE_FOLLOW]:{ dx: -250, dy: 25,   rotation: 270 },
    }

    for (const [posName, expected] of Object.entries(positions)) {
      const pos = pm.get(f, posName)
      expect(pos).toEqual({
        x: center.x + expected.dx * sf,
        y: center.y + expected.dy * sf,
        rotation: expected.rotation,
      })
    }
  })

  it('all 4 TWO_FACING_TWO positions have correct offsets from center', () => {
    const center = pm.center
    const sf = pm.scaleFactor
    const f = Formations.TWO_FACING_TWO
    const positions = {
      [Positions.FIRST_TOP_FOLLOW]:  { dx: -125, dy: -150, rotation: 0 },
      [Positions.FIRST_TOP_LEAD]:    { dx: 25,   dy: -150, rotation: 0 },
      [Positions.SECOND_TOP_FOLLOW]: { dx: 25,   dy: 50,   rotation: 180 },
      [Positions.SECOND_TOP_LEAD]:   { dx: -125, dy: 50,   rotation: 180 },
    }

    for (const [posName, expected] of Object.entries(positions)) {
      const pos = pm.get(f, posName)
      expect(pos).toEqual({
        x: center.x + expected.dx * sf,
        y: center.y + expected.dy * sf,
        rotation: expected.rotation,
      })
    }
  })

  it('rotations: top=0, bottom=180, 1st side=90, 2nd side=270', () => {
    const f = Formations.EIGHT_HAND_SQUARE
    expect(pm.get(f, Positions.FIRST_TOP_LEAD).rotation).toBe(0)
    expect(pm.get(f, Positions.SECOND_TOP_LEAD).rotation).toBe(180)
    expect(pm.get(f, Positions.FIRST_SIDE_LEAD).rotation).toBe(90)
    expect(pm.get(f, Positions.SECOND_SIDE_LEAD).rotation).toBe(270)
  })

  it('second recalculate() with different dimensions updates all positions', () => {
    const posBefore = pm.get(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_TOP_LEAD)

    pm.recalculate(1200, 1000)

    const sf2 = pm.scaleFactor
    const center2 = pm.center
    expect(center2).toEqual({ x: 600, y: 500 })
    const posAfter = pm.get(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_TOP_LEAD)
    expect(posAfter.x).toBe(center2.x + 25 * sf2)
    expect(posAfter.y).toBe(center2.y - 250 * sf2)
    expect(posAfter).not.toEqual(posBefore)
  })
})
