import anime from 'animejs'
import { headerManager } from '../header'
import {
  BEATS,
  Directions,
  FormationGroups,
  Formations,
  Positions,
} from '../enums'
import type { Dancer, DanceMasterState, Direction, Point, Position, PositionWithRotation } from '../types'

export const HEADER_OFFSET = 100
export const INNER_CIRCLE_OFFSET = 100

export const normalizeRotation = (arrow: HTMLDivElement): number => {
  const match = arrow.style.transform.match(/rotate\((.+)deg\)/)
  let rotation = parseInt(match![1])
  rotation = rotation % 360
  if (rotation < 0) {
    rotation += 360
  }
  return rotation
}

export const getFacingDirection = (dancer: Dancer): Direction => {
  const rotation = normalizeRotation(dancer.arrowElem)
  if (rotation >= 46 && rotation < 135) {
    return Directions.LEFT
  } else if (rotation >= 135 && rotation < 225) {
    return Directions.UP
  } else if (rotation >= 225 && rotation < 315) {
    return Directions.RIGHT
  } else {
    return Directions.DOWN
  }
}

export class PositionManager {
  private _center: Point = { x: 0, y: 0 }
  private _formations: Record<string, Record<string, PositionWithRotation>> = {}

  get center(): Point {
    return this._center
  }

  get(formation: string, position: string): PositionWithRotation {
    return this._formations[formation][position]
  }

  recalculate(width: number, height: number): void {
    this._center = {
      x: width / 2,
      y: height / 2 + HEADER_OFFSET,
    }

    const center = this._center

    this._formations = {
      [Formations.EIGHT_HAND_SQUARE]: {
        [Positions.FIRST_TOP_FOLLOW]: {
          x: center.x - 125,
          y: center.y - 250,
          rotation: 0,
        },
        [Positions.FIRST_TOP_LEAD]: {
          x: center.x + 25,
          y: center.y - 250,
          rotation: 0,
        },
        [Positions.SECOND_TOP_FOLLOW]: {
          x: center.x + 25,
          y: center.y + 150,
          rotation: 180,
        },
        [Positions.SECOND_TOP_LEAD]: {
          x: center.x - 125,
          y: center.y + 150,
          rotation: 180,
        },
        [Positions.FIRST_SIDE_LEAD]: {
          x: center.x + 150,
          y: center.y + 25,
          rotation: 90,
        },
        [Positions.FIRST_SIDE_FOLLOW]: {
          x: center.x + 150,
          y: center.y - 125,
          rotation: 90,
        },
        [Positions.SECOND_SIDE_LEAD]: {
          x: center.x - 250,
          y: center.y - 125,
          rotation: 270,
        },
        [Positions.SECOND_SIDE_FOLLOW]: {
          x: center.x - 250,
          y: center.y + 25,
          rotation: 270,
        },
      },
      [Formations.TWO_FACING_TWO]: {
        [Positions.FIRST_TOP_FOLLOW]: {
          x: center.x - 125,
          y: center.y - 150,
          rotation: 0,
        },
        [Positions.FIRST_TOP_LEAD]: {
          x: center.x + 25,
          y: center.y - 150,
          rotation: 0,
        },
        [Positions.SECOND_TOP_FOLLOW]: {
          x: center.x + 25,
          y: center.y + 50,
          rotation: 180,
        },
        [Positions.SECOND_TOP_LEAD]: {
          x: center.x - 125,
          y: center.y + 50,
          rotation: 180,
        },
      },
    }
  }
}

export const positionManager = new PositionManager()
positionManager.recalculate(window.innerWidth, window.innerHeight)

export const getTranslation = (dancer: Dancer): Point => {
  const style = window.getComputedStyle(dancer.elem)
  const transform = style.transform

  if (transform === 'none' || !transform) {
    return { x: 0, y: 0 }
  }

  const matrixMatch = transform.match(/matrix.*\((.+)\)/)

  if (matrixMatch) {
    const values = matrixMatch[1].split(', ').map(parseFloat)

    if (transform.startsWith('matrix3d')) {
      return { x: values[12], y: values[13] }
    } else {
      return { x: values[4], y: values[5] }
    }
  }

  return { x: 0, y: 0 }
}

export function makeTickerTimeline(numOfBeats: number): anime.AnimeTimelineInstance {
  const tickerTimeline = anime.timeline({
    duration: BEATS,
    easing: 'linear',
    autoplay: false,
  })

  for (let i = 0; i < numOfBeats; i++) {
    tickerTimeline.add({
      complete: () => {
        headerManager.tick()
      },
    })
  }
  return tickerTimeline
}

export function calculateAngleAndRotation(
  state: DanceMasterState,
  startingRotation: number,
  startingPosition: Position,
  targetPosition: Position,
  direction: Direction,
  dancer: Dancer,
): { angle: number; rotation: number } {
  let targetAngle = calculateRotationToFacePosition(state, startingPosition, targetPosition, direction, dancer)
  let dancerAngle = startingRotation

  if (targetAngle === 360 && dancerAngle < 0 && dancerAngle > -180 && direction === Directions.RIGHT) {
    targetAngle = 0
  }
  if (targetAngle === 360 && dancerAngle < 180 && dancerAngle > -360 && direction === Directions.LEFT) {
    targetAngle = -360
  }

  if (targetAngle < dancerAngle && direction === Directions.RIGHT) {
    targetAngle += 360
  }
  if (dancerAngle < targetAngle && direction === Directions.LEFT) {
    dancerAngle += 360
  }

  let difference = targetAngle - dancerAngle
  if (difference < 0 && direction === Directions.RIGHT) {
    difference += 360
  }

  return {
    angle: targetAngle,
    rotation: startingRotation + difference,
  }
}

export function calculateRotation(
  state: DanceMasterState,
  dancer: Dancer,
  nextPositionName: Position,
  direction: Direction,
): number {
  const currentRotation = dancer.currentOffset.rotation
  const nextRotation = positionManager.get(state.formation, nextPositionName).rotation
  let difference = Math.abs(nextRotation - currentRotation) % 360
  if (difference > 180) {
    difference = 360 - difference
  }
  return direction === Directions.RIGHT ? currentRotation - difference : currentRotation + difference
}

function calculateRotationToFacePosition(
  state: DanceMasterState,
  startingPositionName: Position,
  targetPositionName: Position,
  direction: Direction,
  dancer: Dancer,
): number {
  const dancerTransform = getTranslation(dancer)
  const startingPosition =
    startingPositionName === Positions.OUT_OF_POSITION
      ? {
          x: dancerTransform.x + positionManager.get(state.formation, dancer.role).x,
          y: dancerTransform.y + positionManager.get(state.formation, dancer.role).y,
        }
      : positionManager.get(state.formation, startingPositionName)
  const targetPosition = positionManager.get(state.formation, targetPositionName)

  return calculateRotationFromPositions(startingPosition, targetPosition, direction)
}

function calculateRotationFromPositions(
  startingPosition: Point,
  targetPosition: Point,
  direction: Direction,
): number {
  let angle =
    ((Math.atan2(targetPosition.y - startingPosition.y, targetPosition.x - startingPosition.x) * 180) / Math.PI) + 270
  angle = angle % 360
  if (angle === 0 && direction === Directions.RIGHT) {
    angle = 360
  }

  return angle
}

function findShortestRotation(
  rotationRight: { rotation: number },
  dancer: Dancer,
  rotationLeft: { rotation: number },
  overrideTurnDirection?: Direction,
): number {
  const differenceRight = Math.abs(rotationRight.rotation - dancer.currentOffset.rotation) % 360
  const differenceLeft = Math.abs(rotationLeft.rotation - dancer.currentOffset.rotation) % 360

  let rotation: number
  if (differenceLeft < differenceRight) {
    rotation = rotationLeft.rotation
  } else {
    rotation = rotationRight.rotation
  }

  if (overrideTurnDirection === Directions.RIGHT) {
    rotation = rotationRight.rotation
  } else if (overrideTurnDirection === Directions.LEFT) {
    rotation = rotationLeft.rotation
  }
  return rotation
}

export function calculateShortestTurnRotation(
  dancer: Dancer,
  targetPositionName: Position,
  state: DanceMasterState,
  overrideTurnDirection?: Direction,
): number {
  const rotationRight = calculateAngleAndRotation(
    state,
    dancer.currentOffset.rotation,
    dancer.currentNamedPosition,
    targetPositionName,
    Directions.RIGHT,
    dancer,
  )
  const rotationLeft = calculateAngleAndRotation(
    state,
    dancer.currentOffset.rotation,
    dancer.currentNamedPosition,
    targetPositionName,
    Directions.LEFT,
    dancer,
  )

  return findShortestRotation(rotationRight, dancer, rotationLeft, overrideTurnDirection)
}

export const getInnerCirclePosition = (formation: string, position: Position): Point => {
  const normalPosition = positionManager.get(formation, position)
  const group = FormationGroups[formation][position]
  const offset = INNER_CIRCLE_OFFSET
  switch (group) {
    case 'TOP':
      return { x: normalPosition.x, y: normalPosition.y + offset }
    case 'BOTTOM':
      return { x: normalPosition.x, y: normalPosition.y - offset }
    case '1st SIDE':
      return { x: normalPosition.x - offset, y: normalPosition.y }
    case '2nd SIDE':
      return { x: normalPosition.x + offset, y: normalPosition.y }
    default:
      return { x: normalPosition.x, y: normalPosition.y }
  }
}

// Re-export for use by move submodules
export { headerManager } from '../header'
export { BEATS, DancerLayouts, Directions, FormationGroups, Formations, Positions, Relationships } from '../enums'
