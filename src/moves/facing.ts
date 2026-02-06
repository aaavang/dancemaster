import anime from 'animejs'
import {
  BEATS,
  DancerLayouts,
  Formations,
  Relationships,
  calculateShortestTurnRotation,
  headerManager,
  makeTickerTimeline,
} from './utils'
import type { Dancer, DanceMasterInstance, Direction, Position } from '../types'

export const facePartner = async (
  danceMaster: DanceMasterInstance,
  doTick = false,
  overrideTurnDirection?: Direction,
): Promise<unknown[]> => {
  headerManager.update('Face Partner')
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []
  switch (state.formation) {
    case Formations.TWO_FACING_TWO:
    case Formations.EIGHT_HAND_SQUARE:
      for (const dancer of Object.values(state.dancers)) {
        const partnerPositionName = danceMaster.getPositionNameFromRelationship(
          dancer.currentNamedPosition,
          Relationships.PARTNER,
        )
        const rotation = calculateShortestTurnRotation(dancer, partnerPositionName, state, overrideTurnDirection)
        if (rotation % 360 === dancer.currentPose.rotation % 360) {
          continue
        }

        const arrowTimeline = anime.timeline({
          duration: 2 * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        arrowTimeline.add({
          targets: dancer.arrowId,
          rotate: rotation,
          complete: () => {
            dancer.currentPose.rotation = rotation
            dancer.facingPartner = true
          },
        })

        timelines.push(arrowTimeline)
      }
      break
    default:
      throw new Error('invalid formation')
  }
  if (doTick) {
    const tickerTimeline = makeTickerTimeline(2)
    timelines.push(tickerTimeline)
  }

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const faceCenter = async (
  danceMaster: DanceMasterInstance,
  doTick = false,
  overrideTurnDirection?: Direction,
): Promise<unknown[]> => {
  headerManager.update('Face Center')
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []
  switch (state.formation) {
    case Formations.TWO_FACING_TWO:
    case Formations.EIGHT_HAND_SQUARE:
      for (const dancer of Object.values(state.dancers)) {
        const opposite = danceMaster.getPositionNameFromRelationship(
          dancer.currentNamedPosition,
          Relationships.OPPOSITE,
        )
        const rotation = calculateShortestTurnRotation(dancer, opposite, state, overrideTurnDirection)

        if (rotation % 360 === dancer.currentPose.rotation % 360) {
          continue
        }

        const arrowTimeline = anime.timeline({
          duration: 2 * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        arrowTimeline.add({
          targets: dancer.arrowId,
          rotate: rotation,
          complete: () => {
            dancer.currentPose.rotation = rotation
            dancer.facingPartner = false
          },
        })

        timelines.push(arrowTimeline)
      }
      break
    default:
      throw new Error('invalid formation')
  }
  if (doTick) {
    const tickerTimeline = makeTickerTimeline(2)
    timelines.push(tickerTimeline)
  }

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const facePosition = (
  danceMaster: DanceMasterInstance,
  dancer: Dancer,
  targetPositionName: string,
  numBeats = 2,
): Promise<unknown> | undefined => {
  if (dancer.currentNamedPosition === targetPositionName) {
    return
  }

  const rotation = calculateShortestTurnRotation(
    dancer,
    targetPositionName as Position,
    danceMaster.state,
  )

  const timeline = anime.timeline({
    targets: dancer.arrowId,
    duration: numBeats * BEATS,
    easing: 'linear',
    autoplay: false,
  })

  timeline.add({
    rotate: rotation,
    complete: () => {
      dancer.currentPose.rotation = rotation
    },
  })

  timeline.play()

  return timeline.finished
}

export const turnAround = async (
  danceMaster: DanceMasterInstance,
  activeRoles: 'ALL' | 'LEADS' | 'FOLLOWS',
): Promise<unknown[]> => {
  headerManager.update('Turn Around')
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []

  for (const dancer of Object.values(state.dancers)) {
    if (activeRoles === 'LEADS' && DancerLayouts[state.formation as keyof typeof DancerLayouts].indexOf(dancer.currentNamedPosition as never) % 2 === 1) {
      continue
    } else if (activeRoles === 'FOLLOWS' && DancerLayouts[state.formation as keyof typeof DancerLayouts].indexOf(dancer.currentNamedPosition as never) % 2 === 0) {
      continue
    }

    const timeline = anime.timeline({
      targets: dancer.arrowId,
      duration: 4 * BEATS,
      easing: 'linear',
      autoplay: false,
    })

    timeline.add({
      rotate: dancer.currentPose.rotation + 180,
      complete: () => {
        dancer.currentPose.rotation += 180
        dancer.turnedAround = !dancer.turnedAround
      },
    })

    timelines.push(timeline)
  }
  const tickerTimeline = makeTickerTimeline(4)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const leadsTurnAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnAround(danceMaster, 'LEADS')
export const followsTurnAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnAround(danceMaster, 'FOLLOWS')
export const allTurnAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnAround(danceMaster, 'ALL')
