import anime from 'animejs'
import {
  BEATS,
  DancerLayouts,
  Positions,
  getTranslation,
  headerManager,
  makeTickerTimeline,
  positionManager,
} from './utils'
import { faceCenter, facePosition } from './facing'
import type { DanceMasterInstance } from '../types'

const MINGLE_MAX_DISTANCE = 200

export const sound = new Audio(import.meta.env.BASE_URL + 'clap.mp3')
sound.preload = 'auto'

export const clapTwice = async (danceMaster: DanceMasterInstance): Promise<unknown[]> => {
  headerManager.update('Clap Twice')
  const state = danceMaster.state
  const timelines: (anime.AnimeTimelineInstance)[] = []

  const tickerTimeline = makeTickerTimeline(2)
  timelines.push(tickerTimeline)

  const clapTimeline = anime.timeline({
    duration: 1 * BEATS,
    autoplay: false,
  })

  clapTimeline.add({
    begin: () => {
      sound.play()
    },
  })

  clapTimeline.add({
    begin: () => {
      sound.play()
    },
  })

  timelines.push(clapTimeline)

  for (const dancer of Object.values(state.dancers)) {
    const dancerTimeline = anime.timeline({
      duration: 0.25 * BEATS,
      autoplay: false,
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      scale: 1.2,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      scale: 1,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      scale: 1.2,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      scale: 1,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })

    dancerTimeline.add({
      targets: dancer.targetId,
      direction: 'alternate',
      easing: 'easeOutElastic(1, .6)',
    })
    timelines.push(dancerTimeline)
  }

  timelines.forEach((timeline) => timeline.play())
  return Promise.all(timelines.map((timeline) => timeline.finished))
}

const goToPosition = (
  danceMaster: DanceMasterInstance,
  dancer: import('../types').Dancer,
  targetPositionName: string,
): Promise<unknown> => {
  const homePosition = positionManager.get(danceMaster.state.formation, dancer.role)
  const targetPosition = positionManager.get(danceMaster.state.formation, targetPositionName)

  const diffX = targetPosition.x - homePosition.x
  const diffY = targetPosition.y - homePosition.y

  const timeline = anime.timeline({
    targets: dancer.targetId,
    duration: 2 * BEATS,
    easing: 'linear',
    autoplay: false,
  })

  timeline.add({
    translateX: diffX,
    translateY: diffY,
    complete: () => {
      dancer.currentNamedPosition = targetPositionName as import('../types').Position
    },
  })

  timeline.play()

  return timeline.finished
}

export const followsGoHome = async (danceMaster: DanceMasterInstance): Promise<void> => {
  let timelines: (Promise<unknown> | undefined)[] = []
  for (const dancer of Object.values(danceMaster.state.dancers)) {
    if ((DancerLayouts[danceMaster.state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition) % 2 === 0) {
      continue
    }
    dancer.turnedAround = false
  }

  for (const dancer of Object.values(danceMaster.state.dancers)) {
    if ((DancerLayouts[danceMaster.state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition) % 2 === 0) {
      continue
    }
    timelines.push(facePosition(danceMaster, dancer, dancer.role, 1))
  }
  await Promise.all(timelines)
  timelines = []

  for (const dancer of Object.values(danceMaster.state.dancers)) {
    if ((DancerLayouts[danceMaster.state.formation as keyof typeof DancerLayouts] as readonly string[]).indexOf(dancer.currentNamedPosition) % 2 === 0) {
      continue
    }
    timelines.push(goToPosition(danceMaster, dancer, dancer.role))
  }
  await Promise.all(timelines)
  danceMaster.normalizeDancerRotations()

  await faceCenter(danceMaster, false)
}

export const goHome = async (danceMaster: DanceMasterInstance): Promise<void> => {
  headerManager.update('Go Home')
  let timelines: (Promise<unknown> | undefined)[] = []
  for (const dancer of Object.values(danceMaster.state.dancers)) {
    dancer.turnedAround = false
  }

  for (const dancer of Object.values(danceMaster.state.dancers)) {
    timelines.push(facePosition(danceMaster, dancer, dancer.role))
  }
  await Promise.all(timelines)
  timelines = []

  for (const dancer of Object.values(danceMaster.state.dancers)) {
    timelines.push(goToPosition(danceMaster, dancer, dancer.role))
  }
  await Promise.all(timelines)
  danceMaster.normalizeDancerRotations()

  await faceCenter(danceMaster, false)
  headerManager.resetCount()
  headerManager.clear()
}

export const randomizeDancerOffsets = (danceMaster: DanceMasterInstance): Promise<void> => {
  const min = -1
  const max = 1
  for (const dancer of Object.values(danceMaster.state.dancers)) {
    dancer.currentOffset = {
      x: (Math.random() * (max - min) + min) * 100,
      y: (Math.random() * (max - min) + min) * 100,
      rotation: Math.random() * 360,
    }
    dancer.currentNamedPosition = Positions.OUT_OF_POSITION
    dancer.elem.style.transform = `translateX(${dancer.currentOffset.x}px) translateY(${dancer.currentOffset.y}px)`
    dancer.arrowElem.style.transform = `rotate(${dancer.currentOffset.rotation}deg)`
  }
  return Promise.resolve()
}

export const mingle = async (danceMaster: DanceMasterInstance): Promise<void> => {
  headerManager.update('Mingling')
  danceMaster.mingling = true
  while (danceMaster.mingling) {
    const timelines: anime.AnimeTimelineInstance[] = []
    for (const dancer of Object.values(danceMaster.state.dancers)) {
      dancer.currentNamedPosition = Positions.OUT_OF_POSITION
      const currentOffsets = getTranslation(dancer)
      const currentPosition = {
        x: currentOffsets.x + positionManager.get(danceMaster.state.formation, dancer.role).x,
        y: currentOffsets.y + positionManager.get(danceMaster.state.formation, dancer.role).y,
      }
      const currentAngle = dancer.currentOffset.rotation + 90
      let newAngle = Math.random() * 360
      let distance = Math.random() * MINGLE_MAX_DISTANCE

      if (currentPosition.x < 50) {
        newAngle = 270
        distance = 100
      } else if (currentPosition.x > window.innerWidth - 50) {
        newAngle = 90
        distance = 100
      } else if (currentPosition.y < 300) {
        newAngle = 0
        distance = 100
      } else if (currentPosition.y > window.innerHeight - 100) {
        newAngle = 180
        distance = 100
      }

      const nextPosition = {
        x: currentOffsets.x + distance * Math.cos(currentAngle * (Math.PI / 180)),
        y: currentOffsets.y + distance * Math.sin(currentAngle * (Math.PI / 180)),
      }

      const timeline = anime.timeline({
        duration: 4 * BEATS,
        easing: 'linear',
        autoplay: false,
      })

      timeline
        .add({
          targets: dancer.targetId,
          translateX: nextPosition.x,
          translateY: nextPosition.y,
          complete: () => {
            dancer.currentOffset.x = nextPosition.x
            dancer.currentOffset.y = nextPosition.y
          },
        })
        .add({
          targets: dancer.arrowId,
          rotate: newAngle,
          complete: () => {
            dancer.currentOffset.rotation = newAngle
          },
        })
      timelines.push(timeline)
    }
    timelines.forEach((timeline) => timeline.play())
    danceMaster.minglingTimelinesPromise = Promise.all(timelines.map((timeline) => timeline.finished))
    await danceMaster.minglingTimelinesPromise
  }
}
