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
import type { DanceMasterInstance, Direction } from '../types'

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
            dancer.currentOffset.rotation = newRotation
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
            dancer.currentOffset.rotation = newRotation
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
