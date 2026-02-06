import anime from 'animejs'
import {
  BEATS,
  DancerLayouts,
  Directions,
  Formations,
  calculateRotation,
  getInnerCirclePosition,
  headerManager,
  makeTickerTimeline,
  positionManager,
} from './utils'
import type { DanceMasterInstance, Dancer, Direction } from '../types'

export const quarterCircle = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
): Promise<unknown[]> => {
  headerManager.update('Quarter Circle ' + direction)
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []

  switch (state.formation) {
    case Formations.EIGHT_HAND_SQUARE:
      for (const dancer of Object.values(state.dancers)) {
        const timeline = anime.timeline({
          targets: dancer.targetId,
          duration: 2 * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        const nextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, dancer.currentNamedPosition)
        const intermediateNextPositionName = danceMaster.getNextPosition(direction, dancer.currentNamedPosition)
        const homePosition = positionManager.get(state.formation, dancer.role)
        const intermediateNextPosition = positionManager.get(state.formation, intermediateNextPositionName)
        const nextPosition = positionManager.get(state.formation, nextPositionName)

        const intermediateTranslateX = intermediateNextPosition.x - homePosition.x
        const intermediateTranslateY = intermediateNextPosition.y - homePosition.y
        const translateX = nextPosition.x - homePosition.x
        const translateY = nextPosition.y - homePosition.y

        timeline
          .add({
            translateX: intermediateTranslateX,
            translateY: intermediateTranslateY,
            complete: () => {
              dancer.currentNamedPosition = intermediateNextPositionName
            },
          })
          .add({
            translateX,
            translateY,
            complete: () => {
              dancer.currentNamedPosition = nextPositionName
            },
          })

        timelines.push(timeline)

        const arrowTimeline = anime.timeline({
          duration: 4 * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        const newRotation = calculateRotation(state, dancer, nextPositionName, direction)

        arrowTimeline.add({
          targets: dancer.arrowId,
          rotate: newRotation,
          complete: () => {
            dancer.currentPose.rotation = newRotation
          },
        })

        timelines.push(arrowTimeline)
      }
      break
    default:
      throw new Error('invalid formation')
  }
  const tickerTimeline = makeTickerTimeline(4)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

const circleHalfway = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
): Promise<void> => {
  headerManager.update(`Circle ${direction}`)
  await quarterCircle(danceMaster, direction)
  await quarterCircle(danceMaster, direction)
}

export const innerQuarterCircle = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
  leadsActive: boolean,
  endInRegularPosition: boolean,
  numBeats = 4,
): Promise<unknown[]> => {
  headerManager.update(`Inner Quarter Circle ${direction} - ${leadsActive ? 'Leads' : 'Follows'}`)
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []

  switch (state.formation) {
    case Formations.EIGHT_HAND_SQUARE:
      for (const dancer of Object.values(state.dancers)) {
        const positionIndex = (DancerLayouts[state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition)

        if (leadsActive && positionIndex % 2 === 1) {
          continue
        } else if (!leadsActive && positionIndex % 2 === 0) {
          continue
        }

        const timeline = anime.timeline({
          targets: dancer.targetId,
          duration: numBeats * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        let modifiedDirection = direction
        if (dancer.turnedAround) {
          modifiedDirection = direction === Directions.RIGHT ? Directions.LEFT : Directions.RIGHT
        }

        const nextPositionName = danceMaster.getNextPositionNameOfSameRole(modifiedDirection, dancer.currentNamedPosition)
        const homePosition = positionManager.get(state.formation, dancer.role)
        const nextPosition = endInRegularPosition
          ? positionManager.get(state.formation, nextPositionName)
          : getInnerCirclePosition(state.formation, nextPositionName)

        const translateX = nextPosition.x - homePosition.x
        const translateY = nextPosition.y - homePosition.y

        timeline.add({
          translateX,
          translateY,
          complete: () => {
            dancer.currentNamedPosition = nextPositionName
            if (endInRegularPosition) {
              dancer.turnedAround = false
            }
          },
        })

        timelines.push(timeline)

        const arrowTimeline = anime.timeline({
          duration: numBeats * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        const newRotation = calculateRotation(state, dancer, nextPositionName, modifiedDirection)

        arrowTimeline.add({
          targets: dancer.arrowId,
          rotate: newRotation,
          complete: () => {
            dancer.currentPose.rotation = newRotation
          },
        })

        timelines.push(arrowTimeline)
      }
      break
    default:
      throw new Error('invalid formation')
  }
  const tickerTimeline = makeTickerTimeline(numBeats)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const quarterCircleLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  quarterCircle(danceMaster, Directions.LEFT)
export const quarterCircleRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  quarterCircle(danceMaster, Directions.RIGHT)
export const circleLeftHalfway = (danceMaster: DanceMasterInstance): Promise<void> =>
  circleHalfway(danceMaster, Directions.LEFT)
export const circleRightHalfway = (danceMaster: DanceMasterInstance): Promise<void> =>
  circleHalfway(danceMaster, Directions.RIGHT)
export const followsFastInnerCircleLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  [1, 2, 3, 4].reduce<Promise<unknown[]>>(
    (promise, val) =>
      promise.then(() => innerQuarterCircle(danceMaster, Directions.LEFT, false, val === 4, 2)),
    Promise.resolve([]),
  )
export const leadsFastInnerCircleLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  [1, 2, 3, 4].reduce<Promise<unknown[]>>(
    (promise, val) =>
      promise.then(() => innerQuarterCircle(danceMaster, Directions.LEFT, true, val === 4, 2)),
    Promise.resolve([]),
  )
export const leadsInnerQuarterCircleRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.RIGHT, true, false)
export const leadsInnerQuarterCircleLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.LEFT, true, false)
export const followsInnerQuarterCircleRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.RIGHT, false, false)
export const followsInnerQuarterCircleLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.LEFT, false, false)
export const leadsInnerQuarterCircleRightEndHome = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.RIGHT, true, true)
export const leadsInnerQuarterCircleLeftEndHome = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.LEFT, true, true)
export const followsInnerQuarterCircleRightEndHome = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.RIGHT, false, true)
export const followsInnerQuarterCircleLeftEndHome = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  innerQuarterCircle(danceMaster, Directions.LEFT, false, true)

function computeArcIntermediatePoint(
  currentPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  arcDirection: Direction,
): { x: number; y: number } {
  const halfwayPoint = {
    x: (currentPos.x + targetPos.x) / 2,
    y: (currentPos.y + targetPos.y) / 2,
  }

  const desiredDistance =
    Math.sqrt(
      Math.pow(halfwayPoint.x - currentPos.x, 2) +
        Math.pow(halfwayPoint.y - currentPos.y, 2),
    ) / 2
  const denominator = Math.sqrt(
    Math.pow(currentPos.y - targetPos.y, 2) +
      Math.pow(targetPos.x - currentPos.x, 2),
  )

  if (denominator === 0) return halfwayPoint

  const modifier = desiredDistance / denominator

  const pointModifier = {
    x: modifier * (currentPos.y - targetPos.y),
    y: modifier * (targetPos.x - currentPos.x),
  }

  return {
    x:
      arcDirection === Directions.RIGHT
        ? halfwayPoint.x - pointModifier.x
        : halfwayPoint.x + pointModifier.x,
    y:
      arcDirection === Directions.RIGHT
        ? halfwayPoint.y - pointModifier.y
        : halfwayPoint.y + pointModifier.y,
  }
}

export const fullChain = async (danceMaster: DanceMasterInstance): Promise<void> => {
  headerManager.update('Full Chain')
  headerManager.freeze()
  const state = danceMaster.state
  const layout = DancerLayouts[state.formation as keyof typeof DancerLayouts] as readonly string[]
  const numSteps = layout.length

  for (let step = 0; step < numSteps; step++) {
    const arcDirection = step % 2 === 0 ? Directions.RIGHT : Directions.LEFT
    const timelines: anime.AnimeTimelineInstance[] = []

    for (const dancer of Object.values(state.dancers)) {
      const isLead = danceMaster.isLead(dancer.role)
      const advanceDirection = isLead ? Directions.RIGHT : Directions.LEFT
      const nextPositionName = danceMaster.getNextPosition(advanceDirection, dancer.currentNamedPosition)

      const homePosition = positionManager.get(state.formation, dancer.role)
      const currentPosition = positionManager.get(state.formation, dancer.currentNamedPosition)
      const nextPosition = positionManager.get(state.formation, nextPositionName)

      const currentOffsets = dancer.getTranslation()

      const intermediatePoint = computeArcIntermediatePoint(currentPosition, nextPosition, arcDirection)

      const intermediateTranslateX = currentOffsets.x + (intermediatePoint.x - currentPosition.x)
      const intermediateTranslateY = currentOffsets.y + (intermediatePoint.y - currentPosition.y)

      const endTranslateX = nextPosition.x - homePosition.x
      const endTranslateY = nextPosition.y - homePosition.y

      const capturedNextPosition = nextPositionName
      const timeline = anime.timeline({
        targets: dancer.targetId,
        duration: 1 * BEATS,
        easing: 'linear',
        autoplay: false,
        complete: () => {
          dancer.currentNamedPosition = capturedNextPosition
        },
      })

      timeline
        .add({
          translateX: intermediateTranslateX,
          translateY: intermediateTranslateY,
        })
        .add({
          translateX: endTranslateX,
          translateY: endTranslateY,
        })

      timelines.push(timeline)

      // Face the direction of travel
      const dx = nextPosition.x - currentPosition.x
      const dy = nextPosition.y - currentPosition.y
      const targetAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 270) % 360

      // Find shortest rotation path from current rotation
      let currentRot = dancer.currentPose.rotation % 360
      if (currentRot < 0) currentRot += 360
      let diff = targetAngle - currentRot
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360
      const newRotation = dancer.currentPose.rotation + diff

      const arrowTimeline = anime.timeline({
        duration: 2 * BEATS,
        easing: 'linear',
        autoplay: false,
      })

      arrowTimeline.add({
        targets: dancer.arrowId,
        rotate: newRotation,
        complete: () => {
          dancer.currentPose.rotation = newRotation
        },
      })

      timelines.push(arrowTimeline)
    }

    const tickerTimeline = makeTickerTimeline(2)
    timelines.push(tickerTimeline)

    timelines.forEach((timeline) => timeline.play())
    await Promise.all(timelines.map((timeline) => timeline.finished))
  }
  headerManager.unfreeze()
}
