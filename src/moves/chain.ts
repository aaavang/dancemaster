import anime from 'animejs'
import {
  BEATS,
  DancerLayouts,
  Directions,
  headerManager,
  makeTickerTimeline,
  positionManager,
} from './utils'
import type { DanceMasterInstance, Direction } from '../types'

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

      // Face the next person to swap with
      const nextSwapPositionName = danceMaster.getNextPosition(advanceDirection, nextPositionName)
      const nextSwapPosition = positionManager.get(state.formation, nextSwapPositionName)
      const dx = nextSwapPosition.x - nextPosition.x
      const dy = nextSwapPosition.y - nextPosition.y
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
