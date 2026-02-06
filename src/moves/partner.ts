import anime from 'animejs'
import {
  BEATS,
  Directions,
  FormationGroups,
  Formations,
  Positions,
  getTranslation,
  headerManager,
  makeTickerTimeline,
  positionManager,
} from './utils'
import type { DanceMasterInstance, Direction } from '../types'

const ADVANCE_DISTANCE = 50

export const switchWithPartner = async (
  danceMaster: DanceMasterInstance,
  numBeats = 4,
): Promise<unknown[]> => {
  const state = danceMaster.state
  headerManager.update('Switch With Partner')
  const timelines: anime.AnimeTimelineInstance[] = []
  switch (state.formation) {
    case Formations.TWO_FACING_TWO:
    case Formations.EIGHT_HAND_SQUARE: {
      const groups: Record<string, typeof state.dancers[string][]> = {}
      for (const dancer of Object.values(state.dancers)) {
        const group = FormationGroups[state.formation][dancer.currentNamedPosition]
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(dancer)
      }

      Object.values(groups).forEach((group) => {
        const [dancer1, dancer2] = group
        const dancer1Timeline = anime.timeline({
          duration: numBeats * BEATS,
          easing: 'linear',
          autoplay: false,
        })
        const dancer2Timeline = anime.timeline({
          duration: numBeats * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        const dancer1DesiredPosition = positionManager.get(state.formation, dancer2.currentNamedPosition)
        const dancer2DesiredPosition = positionManager.get(state.formation, dancer1.currentNamedPosition)
        const dancer1StartingPosition = positionManager.get(state.formation, dancer1.role)
        const dancer2StartingPosition = positionManager.get(state.formation, dancer2.role)

        dancer1Timeline.add({
          targets: dancer1.targetId,
          translateX: dancer1DesiredPosition.x - dancer1StartingPosition.x,
          translateY: dancer1DesiredPosition.y - dancer1StartingPosition.y,
          complete: () => {
            const tempNamedPosition = dancer1.currentNamedPosition
            const tempPosition = { ...dancer1.position }
            dancer1.currentNamedPosition = dancer2.currentNamedPosition
            dancer1.position = dancer2.position
            dancer2.currentNamedPosition = tempNamedPosition
            dancer2.position = tempPosition
          },
        })

        dancer2Timeline.add({
          targets: dancer2.targetId,
          translateX: dancer2DesiredPosition.x - dancer2StartingPosition.x,
          translateY: dancer2DesiredPosition.y - dancer2StartingPosition.y,
        })

        timelines.push(dancer1Timeline)
        timelines.push(dancer2Timeline)
      })
      break
    }
    default:
      throw new Error('invalid formation')
  }
  const tickerTimeline = makeTickerTimeline(numBeats)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const fastSevensWithPartner = async (danceMaster: DanceMasterInstance): Promise<void> => {
  headerManager.update('Fast Sevens')
  headerManager.freeze()
  await switchWithPartner(danceMaster)
  await switchWithPartner(danceMaster)
  headerManager.unfreeze()
}

export const advanceAndRetire = async (danceMaster: DanceMasterInstance): Promise<unknown[]> => {
  const state = danceMaster.state
  headerManager.update('Advance and Retire')
  const timelines: anime.AnimeTimelineInstance[] = []
  switch (state.formation) {
    case Formations.TWO_FACING_TWO:
    case Formations.EIGHT_HAND_SQUARE:
      for (const dancer of Object.values(state.dancers)) {
        const timeline = anime.timeline({
          duration: 4 * BEATS,
          easing: 'linear',
          autoplay: false,
        })

        const startingPosition = positionManager.get(state.formation, dancer.role)
        const currentPosition = positionManager.get(state.formation, dancer.currentNamedPosition)
        const startingOffsetX = currentPosition.x - startingPosition.x
        const startingOffsetY = currentPosition.y - startingPosition.y

        let translateX = startingOffsetX
        let translateY = startingOffsetY

        switch (dancer.currentNamedPosition) {
          case Positions.FIRST_TOP_LEAD:
          case Positions.FIRST_TOP_FOLLOW:
            translateY += ADVANCE_DISTANCE
            break
          case Positions.SECOND_TOP_LEAD:
          case Positions.SECOND_TOP_FOLLOW:
            translateY -= ADVANCE_DISTANCE
            break
          case Positions.FIRST_SIDE_LEAD:
          case Positions.FIRST_SIDE_FOLLOW:
            translateX -= ADVANCE_DISTANCE
            break
          case Positions.SECOND_SIDE_LEAD:
          case Positions.SECOND_SIDE_FOLLOW:
            translateX += ADVANCE_DISTANCE
            break
        }

        timeline
          .add({
            targets: dancer.targetId,
            translateX,
            translateY,
          })
          .add({
            targets: dancer.targetId,
            translateX: startingOffsetX,
            translateY: startingOffsetY,
          })

        timelines.push(timeline)
      }
      break
    default:
      throw new Error('invalid formation')
  }
  const tickerTimeline = makeTickerTimeline(8)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

const turnPartnerHalfway = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
  endFacingCenter = false,
  snapToPosition = true,
): Promise<unknown[]> => {
  headerManager.update(`Turn Partner Halfway ${direction}`)
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []

  for (const dancer of Object.values(state.dancers)) {
    const partnerPositionName = danceMaster.getPositionNameFromRelationship(
      dancer.currentNamedPosition,
      'PARTNER',
    )
    const currentPosition = positionManager.get(state.formation, dancer.currentNamedPosition)
    const partnerPosition = positionManager.get(state.formation, partnerPositionName)
    const currentOffsets =
      snapToPosition && dancer.currentNamedPosition === dancer.role
        ? { x: 0, y: 0 }
        : getTranslation(dancer)

    const halfwayPoint = {
      x: (currentPosition.x + partnerPosition.x) / 2,
      y: (currentPosition.y + partnerPosition.y) / 2,
    }

    const desiredDistance =
      Math.sqrt(
        Math.pow(halfwayPoint.x - currentPosition.x, 2) +
          Math.pow(halfwayPoint.y - currentPosition.y, 2),
      ) / 2
    const modifier =
      desiredDistance /
      Math.sqrt(
        Math.pow(currentPosition.y - partnerPosition.y, 2) +
          Math.pow(partnerPosition.x - currentPosition.x, 2),
      )

    const pointModifier = {
      x: modifier * (currentPosition.y - partnerPosition.y),
      y: modifier * (partnerPosition.x - currentPosition.x),
    }

    const intermediatePoint = {
      x:
        direction === Directions.RIGHT
          ? halfwayPoint.x - pointModifier.x
          : halfwayPoint.x + pointModifier.x,
      y:
        direction === Directions.RIGHT
          ? halfwayPoint.y - pointModifier.y
          : halfwayPoint.y + pointModifier.y,
    }

    const timeline = anime.timeline({
      targets: dancer.targetId,
      duration: 1 * BEATS,
      easing: 'linear',
      autoplay: false,
      complete: () => {
        dancer.currentNamedPosition = partnerPositionName
      },
    })

    const intermediateTranslateX = currentOffsets.x + (intermediatePoint.x - currentPosition.x)
    const intermediateTranslateY = currentOffsets.y + (intermediatePoint.y - currentPosition.y)

    const endTranslateX = currentOffsets.x + (partnerPosition.x - currentPosition.x)
    const endTranslateY = currentOffsets.y + (partnerPosition.y - currentPosition.y)

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

    const newRotation = endFacingCenter
      ? positionManager.get(state.formation, partnerPositionName).rotation
      : (dancer.currentOffset.rotation += direction === Directions.RIGHT ? 180 : -180)
    const arrowTimeline = anime.timeline({
      duration: 2 * BEATS,
      easing: 'linear',
      autoplay: false,
    })

    arrowTimeline.add({
      targets: dancer.arrowId,
      rotate: newRotation,
      complete: () => {
        dancer.currentOffset.rotation = newRotation
      },
    })

    timelines.push(arrowTimeline)
  }
  const tickerTimeline = makeTickerTimeline(2)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const swingPartner = async (
  danceMaster: DanceMasterInstance,
  endFacingCenter = false,
): Promise<void> => {
  headerManager.update('Swing Partner')
  headerManager.freeze()
  await turnPartnerHalfway(danceMaster, Directions.RIGHT)
  await turnPartnerHalfway(danceMaster, Directions.RIGHT)
  await turnPartnerHalfway(danceMaster, Directions.RIGHT)
  await turnPartnerHalfway(danceMaster, Directions.RIGHT, endFacingCenter)
  headerManager.unfreeze()
}

export const swingPartnerEndFacingCenter = async (danceMaster: DanceMasterInstance): Promise<void> => {
  return swingPartner(danceMaster, true)
}

export const turnPartnerHalfwayByTheRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnPartnerHalfway(danceMaster, Directions.RIGHT)
export const turnPartnerHalfwayByTheRightEndFacingCenter = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnPartnerHalfway(danceMaster, Directions.RIGHT, true)
export const turnPartnerHalfwayByTheLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnPartnerHalfway(danceMaster, Directions.LEFT)
export const turnPartnerHalfwayByTheLeftEndFacingCenter = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  turnPartnerHalfway(danceMaster, Directions.LEFT, true)
export const fastSwitchWithPartner = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  switchWithPartner(danceMaster, 2)
