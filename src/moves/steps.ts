import anime from 'animejs'
import { Role } from '../enums'
import {
  BEATS,
  Directions,
  getFacingDirection,
  getTranslation,
  headerManager,
  makeTickerTimeline,
} from './utils'
import { facePartner, leadsTurnAround, followsTurnAround } from './facing'
import type { DanceMasterInstance, Direction, RoleName } from '../types'

const SIDESTEP_DISTANCE = 100

export const sidestep = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
): Promise<unknown[]> => {
  headerManager.update(`Sidestep ${direction}`)
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []
  for (const dancer of Object.values(state.dancers)) {
    const timeline = anime.timeline({
      targets: dancer.targetId,
      duration: 4 * BEATS,
      easing: 'linear',
      autoplay: false,
    })
    const currentOffsets = getTranslation(dancer)
    const directionFacing = getFacingDirection(dancer)
    let xOffset = currentOffsets.x
    let yOffset = currentOffsets.y

    switch (directionFacing) {
      case Directions.LEFT:
        yOffset += direction === Directions.RIGHT ? -SIDESTEP_DISTANCE : SIDESTEP_DISTANCE
        break
      case Directions.RIGHT:
        yOffset += direction === Directions.RIGHT ? SIDESTEP_DISTANCE : -SIDESTEP_DISTANCE
        break
      case Directions.UP:
        xOffset += direction === Directions.RIGHT ? SIDESTEP_DISTANCE : -SIDESTEP_DISTANCE
        break
      case Directions.DOWN:
        xOffset += direction === Directions.RIGHT ? -SIDESTEP_DISTANCE : SIDESTEP_DISTANCE
        break
    }

    timeline
      .add({
        translateX: xOffset,
        translateY: yOffset,
      })
      .add({
        translateX: currentOffsets.x,
        translateY: currentOffsets.y,
      })

    timelines.push(timeline)
  }
  const tickerTimeline = makeTickerTimeline(8)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const twoThrees = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
  whosActive: RoleName = Role.ALL,
): Promise<unknown[]> => {
  const state = danceMaster.state
  headerManager.update('Two Threes')
  const timelines: anime.AnimeTimelineInstance[] = []
  for (const dancer of Object.values(state.dancers)) {
    if (whosActive === Role.LEAD && !dancer.role.includes('lead')) {
      continue
    } else if (whosActive === Role.FOLLOW && !dancer.role.includes('follow')) {
      continue
    }

    const timeline = anime.timeline({
      targets: dancer.targetId,
      duration: 1 * BEATS,
      easing: 'easeOutQuint',
      autoplay: false,
    })

    const currentOffsets = getTranslation(dancer)
    const currentDirection = getFacingDirection(dancer)

    let firstTranslateX = currentOffsets.x
    let secondTranslateX = currentOffsets.x
    let firstTranslateY = currentOffsets.y
    let secondTranslateY = currentOffsets.y

    const bumpAmount = 10
    switch (currentDirection) {
      case Directions.DOWN:
        firstTranslateX -= bumpAmount
        secondTranslateX += bumpAmount
        break
      case Directions.UP:
        firstTranslateX += bumpAmount
        secondTranslateX -= bumpAmount
        break
      case Directions.LEFT:
        firstTranslateY -= bumpAmount
        secondTranslateY += bumpAmount
        break
      case Directions.RIGHT:
        firstTranslateY += bumpAmount
        secondTranslateY -= bumpAmount
    }

    timeline
      .add({
        translateX: direction === Directions.RIGHT ? firstTranslateX : secondTranslateX,
        translateY: direction === Directions.RIGHT ? firstTranslateY : secondTranslateY,
      })
      .add({
        translateX: currentOffsets.x,
        translateY: currentOffsets.y,
      })
      .add({
        translateX: direction === Directions.RIGHT ? secondTranslateX : firstTranslateX,
        translateY: direction === Directions.RIGHT ? secondTranslateY : firstTranslateY,
      })
      .add({
        translateX: currentOffsets.x,
        translateY: currentOffsets.y,
      })

    timelines.push(timeline)
  }
  const tickerTimeline = makeTickerTimeline(4)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const sidestepRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  sidestep(danceMaster, Directions.RIGHT)
export const sidestepLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  sidestep(danceMaster, Directions.LEFT)
export const twoThreesToTheRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.RIGHT)
export const twoThreesToTheLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.LEFT)
export const followsTwoThreesToTheRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.RIGHT, Role.FOLLOW)
export const leadsTwoThreesToTheRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.RIGHT, Role.LEAD)
export const followsTwoThreesToTheLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.LEFT, Role.FOLLOW)
export const leadsTwoThreesToTheLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  twoThrees(danceMaster, Directions.LEFT, Role.LEAD)
export const followsTwoThreesToTheLeftWhileTurningAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.LEFT, Role.FOLLOW), followsTurnAround(danceMaster)])
export const leadsTwoThreesToTheLeftWhileTurningAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.LEFT, Role.LEAD), leadsTurnAround(danceMaster)])
export const followsTwoThreesToTheRightWhileTurningAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.RIGHT, Role.FOLLOW), followsTurnAround(danceMaster)])
export const leadsTwoThreesToTheRightWhileTurningAround = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.RIGHT, Role.LEAD), leadsTurnAround(danceMaster)])
export const twoThreesToTheRightEndFacingPartner = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.RIGHT), facePartner(danceMaster)])
export const twoThreesToTheLeftEndFacingPartner = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  Promise.all([twoThrees(danceMaster, Directions.LEFT), facePartner(danceMaster)])
