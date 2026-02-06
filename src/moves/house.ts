import anime from 'animejs'
import {
  BEATS,
  DancerLayouts,
  Directions,
  FormationGroups,
  calculateAngleAndRotation,
  getTranslation,
  headerManager,
  makeTickerTimeline,
  positionManager,
} from './utils'
import type { DanceMasterInstance, Direction } from '../types'

export const quarterHouse = async (
  danceMaster: DanceMasterInstance,
  direction: Direction,
): Promise<unknown[]> => {
  headerManager.update(`Quarter House ${direction}`)
  const state = danceMaster.state
  const timelines: anime.AnimeTimelineInstance[] = []

  const groups: Record<string, typeof state.dancers[string][]> = {}
  for (const dancer of Object.values(state.dancers)) {
    const group = FormationGroups[state.formation][dancer.currentNamedPosition]
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(dancer)
  }

  for (const group of Object.values(groups)) {
    const lead = group.find(
      (dancer) =>
        (DancerLayouts[state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition) % 2 === 0,
    )!
    const follow = group.find(
      (dancer) =>
        (DancerLayouts[state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition) % 2 === 1,
    )!

    const timeline = anime.timeline({
      duration: 2 * BEATS,
      easing: 'linear',
      autoplay: false,
    })

    const leadArrowTimeline = anime.timeline({
      targets: lead.arrowId,
      duration: 2 * BEATS,
      easing: 'linear',
      autoplay: false,
    })

    const followArrowTimeline = anime.timeline({
      targets: follow.arrowId,
      duration: 2 * BEATS,
      easing: 'linear',
      autoplay: false,
    })

    let leadsMoving = direction === Directions.RIGHT
    for (let i = 0; i < 2; ++i) {
      const movingDancer = leadsMoving ? lead : follow
      const partner = leadsMoving ? follow : lead
      const movingTimeline = leadsMoving ? leadArrowTimeline : followArrowTimeline

      const currentPosition = positionManager.get(state.formation, movingDancer.currentNamedPosition)
      const nextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, movingDancer.currentNamedPosition)
      const partnerNextPositionName = danceMaster.getNextPositionNameOfSameRole(direction, partner.currentNamedPosition)
      const nextPosition = positionManager.get(state.formation, nextPositionName)
      const movingCurrentOffsets = getTranslation(movingDancer)

      const translateX = movingCurrentOffsets.x + (nextPosition.x - currentPosition.x)
      const translateY = movingCurrentOffsets.y + (nextPosition.y - currentPosition.y)

      timeline.add({
        targets: movingDancer.targetId,
        translateX,
        translateY,
        complete: () => {
          movingDancer.currentNamedPosition = nextPositionName
        },
      })

      let intermediateStartPosition: string
      let intermediateTargetPosition: string
      if (direction === Directions.RIGHT) {
        if (leadsMoving) {
          intermediateStartPosition = nextPositionName
          intermediateTargetPosition = partner.currentNamedPosition
        } else {
          intermediateStartPosition = movingDancer.currentNamedPosition
          intermediateTargetPosition = partnerNextPositionName
        }
      } else {
        if (leadsMoving) {
          intermediateStartPosition = movingDancer.currentNamedPosition
          intermediateTargetPosition = partnerNextPositionName
        } else {
          intermediateStartPosition = nextPositionName
          intermediateTargetPosition = partner.currentNamedPosition
        }
      }

      const intermediateAngleAndRotation = calculateAngleAndRotation(
        state,
        movingDancer.currentOffset.rotation,
        intermediateStartPosition as import('../types').Position,
        intermediateTargetPosition as import('../types').Position,
        direction,
        movingDancer,
      )

      movingTimeline.add({
        targets: movingDancer.arrowId,
        rotate: intermediateAngleAndRotation.rotation,
        complete: () => {
          movingDancer.currentOffset.rotation = intermediateAngleAndRotation.rotation
        },
      })

      const finalAngleAndRotation = calculateAngleAndRotation(
        state,
        intermediateAngleAndRotation.rotation,
        nextPositionName as import('../types').Position,
        partnerNextPositionName as import('../types').Position,
        direction,
        movingDancer,
      )

      movingTimeline.add({
        rotate: finalAngleAndRotation.rotation,
        complete: () => {
          movingDancer.currentOffset.rotation = finalAngleAndRotation.rotation
        },
      })

      leadsMoving = !leadsMoving
    }
    timelines.push(timeline)
    timelines.push(leadArrowTimeline)
    timelines.push(followArrowTimeline)
  }

  const tickerTimeline = makeTickerTimeline(4)
  timelines.push(tickerTimeline)

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

export const quarterHouseRight = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  quarterHouse(danceMaster, Directions.RIGHT)
export const quarterHouseLeft = (danceMaster: DanceMasterInstance): Promise<unknown[]> =>
  quarterHouse(danceMaster, Directions.LEFT)
