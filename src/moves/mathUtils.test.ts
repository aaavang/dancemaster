import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeRotation,
  getFacingDirection,
  calculateRotation,
  getInnerCirclePosition,
  positionManager,
  PositionManager,
  INNER_CIRCLE_OFFSET,
} from './utils'
import { Formations, Positions, Directions } from '../enums'
import type { Dancer, DanceMasterState } from '../types'

function mockArrow(degrees: number): HTMLDivElement {
  const el = document.createElement('div')
  el.style.transform = `rotate(${degrees}deg)`
  return el
}

function mockDancer(overrides: Partial<Dancer>): Dancer {
  return {
    name: 'Test',
    color: 'red',
    elem: document.createElement('div'),
    role: Positions.FIRST_TOP_LEAD,
    targetId: '#first-top-lead',
    arrowId: '#arrow-first-top-lead',
    arrowElem: mockArrow(0),
    position: { x: 0, y: 0, rotation: 0 },
    currentNamedPosition: Positions.FIRST_TOP_LEAD,
    group: 'TOP',
    currentOffset: { x: 0, y: 0, rotation: 0 },
    facingPartner: false,
    turnedAround: false,
    ...overrides,
  }
}

describe('normalizeRotation', () => {
  it('returns rotation from transform string', () => {
    expect(normalizeRotation(mockArrow(90))).toBe(90)
  })

  it('normalizes negative rotation', () => {
    expect(normalizeRotation(mockArrow(-90))).toBe(270)
  })

  it('normalizes rotation > 360', () => {
    expect(normalizeRotation(mockArrow(450))).toBe(90)
  })

  it('returns 0 for rotate(0deg)', () => {
    expect(normalizeRotation(mockArrow(0))).toBe(0)
  })
})

describe('getFacingDirection', () => {
  it('rotation 0 → DOWN', () => {
    const dancer = mockDancer({ arrowElem: mockArrow(0) })
    expect(getFacingDirection(dancer)).toBe(Directions.DOWN)
  })

  it('rotation 90 → LEFT', () => {
    const dancer = mockDancer({ arrowElem: mockArrow(90) })
    expect(getFacingDirection(dancer)).toBe(Directions.LEFT)
  })

  it('rotation 180 → UP', () => {
    const dancer = mockDancer({ arrowElem: mockArrow(180) })
    expect(getFacingDirection(dancer)).toBe(Directions.UP)
  })

  it('rotation 270 → RIGHT', () => {
    const dancer = mockDancer({ arrowElem: mockArrow(270) })
    expect(getFacingDirection(dancer)).toBe(Directions.RIGHT)
  })
})

describe('calculateRotation', () => {
  let pm: PositionManager
  let state: DanceMasterState

  beforeEach(() => {
    pm = new PositionManager()
    pm.recalculate(1000, 800)
    state = {
      formation: Formations.EIGHT_HAND_SQUARE,
      dancers: {},
    }
  })

  it('dancer at rotation 0, moving to position with rotation 90, direction RIGHT → returns -90', () => {
    const dancer = mockDancer({
      currentOffset: { x: 0, y: 0, rotation: 0 },
    })
    // FIRST_SIDE_LEAD has rotation 90
    const result = calculateRotation(state, dancer, Positions.FIRST_SIDE_LEAD, Directions.RIGHT)
    expect(result).toBe(-90)
  })

  it('dancer at rotation 0, moving to position with rotation 90, direction LEFT → returns 90', () => {
    const dancer = mockDancer({
      currentOffset: { x: 0, y: 0, rotation: 0 },
    })
    const result = calculateRotation(state, dancer, Positions.FIRST_SIDE_LEAD, Directions.LEFT)
    expect(result).toBe(90)
  })

  it('difference > 180 wraps correctly', () => {
    // Dancer at rotation 0, target rotation 270 → difference is 270, wraps to 90
    const dancer = mockDancer({
      currentOffset: { x: 0, y: 0, rotation: 0 },
    })
    // SECOND_SIDE_LEAD has rotation 270
    const resultRight = calculateRotation(state, dancer, Positions.SECOND_SIDE_LEAD, Directions.RIGHT)
    expect(resultRight).toBe(-90)

    const resultLeft = calculateRotation(state, dancer, Positions.SECOND_SIDE_LEAD, Directions.LEFT)
    expect(resultLeft).toBe(90)
  })
})

describe('getInnerCirclePosition', () => {
  beforeEach(() => {
    // getInnerCirclePosition uses the module-level singleton positionManager
    positionManager.recalculate(1000, 800)
  })

  it('TOP group: y offset +100', () => {
    const normal = positionManager.get(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_TOP_LEAD)
    const inner = getInnerCirclePosition(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_TOP_LEAD)
    expect(inner).toEqual({ x: normal.x, y: normal.y + INNER_CIRCLE_OFFSET })
  })

  it('BOTTOM group: y offset -100', () => {
    const normal = positionManager.get(Formations.EIGHT_HAND_SQUARE, Positions.SECOND_TOP_LEAD)
    const inner = getInnerCirclePosition(Formations.EIGHT_HAND_SQUARE, Positions.SECOND_TOP_LEAD)
    expect(inner).toEqual({ x: normal.x, y: normal.y - INNER_CIRCLE_OFFSET })
  })

  it('1st SIDE group: x offset -100', () => {
    const normal = positionManager.get(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_SIDE_LEAD)
    const inner = getInnerCirclePosition(Formations.EIGHT_HAND_SQUARE, Positions.FIRST_SIDE_LEAD)
    expect(inner).toEqual({ x: normal.x - INNER_CIRCLE_OFFSET, y: normal.y })
  })

  it('2nd SIDE group: x offset +100', () => {
    const normal = positionManager.get(Formations.EIGHT_HAND_SQUARE, Positions.SECOND_SIDE_LEAD)
    const inner = getInnerCirclePosition(Formations.EIGHT_HAND_SQUARE, Positions.SECOND_SIDE_LEAD)
    expect(inner).toEqual({ x: normal.x + INNER_CIRCLE_OFFSET, y: normal.y })
  })
})
