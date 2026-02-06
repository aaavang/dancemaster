import './style.css'
import { Formations } from './enums'
import {
  positionManager,
  goHome,
  mingle,
  randomizeDancerOffsets,
  quarterHouseRight,
  quarterHouseLeft,
  swingPartner,
  leadsTurnAround,
  followsTurnAround,
  allTurnAround,
  turnPartnerHalfwayByTheRight,
  turnPartnerHalfwayByTheLeft,
  sidestepRight,
  sidestepLeft,
  faceCenter,
  facePartner,
  twoThreesToTheRight,
  twoThreesToTheLeft,
  twoThreesToTheRightEndFacingPartner,
  twoThreesToTheLeftEndFacingPartner,
  advanceAndRetire,
  fastSevensWithPartner,
  switchWithPartner,
  fastSwitchWithPartner,
  quarterCircle,
  quarterCircleLeft,
  quarterCircleRight,
  circleLeftHalfway,
  circleRightHalfway,
  followsFastInnerCircleLeft,
  leadsFastInnerCircleLeft,
  leadsInnerQuarterCircleRight,
  leadsInnerQuarterCircleLeft,
  followsInnerQuarterCircleRight,
  followsInnerQuarterCircleLeft,
  leadsInnerQuarterCircleRightEndHome,
  leadsInnerQuarterCircleLeftEndHome,
  followsInnerQuarterCircleRightEndHome,
  followsInnerQuarterCircleLeftEndHome,
  fullChain,
  clapTwice,
  followsTwoThreesToTheLeftWhileTurningAround,
  leadsTwoThreesToTheLeftWhileTurningAround,
  leadsTwoThreesToTheRightWhileTurningAround,
  followsTwoThreesToTheRightWhileTurningAround,
  turnPartnerHalfwayByTheRightEndFacingCenter,
  turnPartnerHalfwayByTheLeftEndFacingCenter,
} from './moves'
import { dances } from './dances'
import { DanceMaster } from './danceMaster'
import { headerManager } from './header'
import type { DanceMasterInstance, Formation, MoveFunction } from './types'

let danceMaster: DanceMaster | undefined

window.onload = async () => {
  const danceFloor = document.getElementById('dance-floor') as HTMLDivElement

  danceMaster = new DanceMaster({
    formation: Formations.EIGHT_HAND_SQUARE,
    danceFloor,
    headerManager,
  })

  window.addEventListener('resize', function () {
    positionManager.recalculate(window.innerWidth, window.innerHeight)
    danceMaster!.adjustPositions()
  })

  // Panel toggle
  const panelToggle = document.getElementById('panel-toggle')!
  const controls = document.getElementById('controls')!

  panelToggle.addEventListener('click', () => {
    const isOpen = controls.classList.toggle('panel-open')
    panelToggle.innerHTML = isOpen ? '&#10005;' : '&#9776;'
  })

  // Default panel state based on viewport
  if (window.innerWidth > 768) {
    controls.classList.add('panel-open')
    panelToggle.innerHTML = '&#10005;'
  }

  // Accordion headers
  document.querySelectorAll('.accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const section = header.parentElement!
      const expanded = section.getAttribute('data-expanded') === 'true'
      section.setAttribute('data-expanded', String(!expanded))
    })
  })

  // Formations
  const formationButtons = document.getElementById('formations')!
  for (const formation of Object.values(Formations)) {
    const button = document.createElement('button')
    button.innerHTML = formation
    button.onclick = () => {
      resetDanceMaster(formation)
    }
    formationButtons.appendChild(button)
  }

  // Dances
  const danceButtons = document.getElementById('dances')!
  for (const dance of Object.values(dances)) {
    const button = document.createElement('button')
    button.innerHTML = dance.name
    button.onclick = async () => {
      await performDance(dance)
    }
    danceButtons.appendChild(button)
  }

  // Categorized moves
  const moveCategories: Record<string, Array<{ name: string; func: MoveFunction }>> = {
    'moves-special': [
      { name: 'goHome', func: goHome },
      { name: 'mingle', func: mingle },
      { name: 'randomizeDancerOffsets', func: randomizeDancerOffsets },
      { name: 'clapTwice', func: clapTwice },
    ],
    'moves-partner': [
      { name: 'swingPartner', func: swingPartner },
      { name: 'turnPartnerHalfwayByTheRight', func: turnPartnerHalfwayByTheRight },
      { name: 'turnPartnerHalfwayByTheRightEndFacingCenter', func: turnPartnerHalfwayByTheRightEndFacingCenter },
      { name: 'turnPartnerHalfwayByTheLeft', func: turnPartnerHalfwayByTheLeft },
      { name: 'turnPartnerHalfwayByTheLeftEndFacingCenter', func: turnPartnerHalfwayByTheLeftEndFacingCenter },
      { name: 'switchWithPartner', func: switchWithPartner },
      { name: 'fastSwitchWithPartner', func: fastSwitchWithPartner },
      { name: 'fastSevensWithPartner', func: fastSevensWithPartner },
      { name: 'advanceAndRetire', func: advanceAndRetire },
    ],
    'moves-circle': [
      { name: 'quarterCircle', func: quarterCircle as MoveFunction },
      { name: 'quarterCircleLeft', func: quarterCircleLeft },
      { name: 'quarterCircleRight', func: quarterCircleRight },
      { name: 'circleLeftHalfway', func: circleLeftHalfway },
      { name: 'circleRightHalfway', func: circleRightHalfway },
      { name: 'followsFastInnerCircleLeft', func: followsFastInnerCircleLeft },
      { name: 'leadsFastInnerCircleLeft', func: leadsFastInnerCircleLeft },
      { name: 'leadsInnerQuarterCircleRight', func: leadsInnerQuarterCircleRight },
      { name: 'leadsInnerQuarterCircleLeft', func: leadsInnerQuarterCircleLeft },
      { name: 'followsInnerQuarterCircleRight', func: followsInnerQuarterCircleRight },
      { name: 'followsInnerQuarterCircleLeft', func: followsInnerQuarterCircleLeft },
      { name: 'leadsInnerQuarterCircleRightEndHome', func: leadsInnerQuarterCircleRightEndHome },
      { name: 'leadsInnerQuarterCircleLeftEndHome', func: leadsInnerQuarterCircleLeftEndHome },
      { name: 'followsInnerQuarterCircleRightEndHome', func: followsInnerQuarterCircleRightEndHome },
      { name: 'followsInnerQuarterCircleLeftEndHome', func: followsInnerQuarterCircleLeftEndHome },
      { name: 'fullChain', func: fullChain },
    ],
    'moves-facing': [
      { name: 'faceCenter', func: faceCenter },
      { name: 'facePartner', func: facePartner },
      { name: 'leadsTurnAround', func: leadsTurnAround },
      { name: 'followsTurnAround', func: followsTurnAround },
      { name: 'allTurnAround', func: allTurnAround },
    ],
    'moves-steps': [
      { name: 'sidestepRight', func: sidestepRight },
      { name: 'sidestepLeft', func: sidestepLeft },
      { name: 'twoThreesToTheRight', func: twoThreesToTheRight },
      { name: 'twoThreesToTheLeft', func: twoThreesToTheLeft },
      { name: 'twoThreesToTheRightEndFacingPartner', func: twoThreesToTheRightEndFacingPartner },
      { name: 'twoThreesToTheLeftEndFacingPartner', func: twoThreesToTheLeftEndFacingPartner },
      { name: 'followsTwoThreesToTheLeftWhileTurningAround', func: followsTwoThreesToTheLeftWhileTurningAround },
      { name: 'leadsTwoThreesToTheLeftWhileTurningAround', func: leadsTwoThreesToTheLeftWhileTurningAround },
      { name: 'followsTwoThreesToTheRightWhileTurningAround', func: followsTwoThreesToTheRightWhileTurningAround },
      { name: 'leadsTwoThreesToTheRightWhileTurningAround', func: leadsTwoThreesToTheRightWhileTurningAround },
    ],
    'moves-house': [
      { name: 'quarterHouseRight', func: quarterHouseRight },
      { name: 'quarterHouseLeft', func: quarterHouseLeft },
    ],
  }

  for (const [containerId, moves] of Object.entries(moveCategories)) {
    const container = document.getElementById(containerId)!
    for (const move of moves) {
      const button = document.createElement('button')
      button.innerHTML = move.name
      button.onclick = () => {
        danceMaster!.runMove(move.func)
      }
      container.appendChild(button)
    }
  }

  await danceMaster.runMove(randomizeDancerOffsets)
  await danceMaster.runMove(mingle)
}

const resetDanceMaster = (formation: Formation): void => {
  const danceFloor = danceMaster!.danceFloor
  danceMaster!.clear()
  danceMaster = new DanceMaster({
    formation,
    danceFloor,
    headerManager,
  })
}

const performDance = async (dance: { formation: Formation; executor: { do: (dm: DanceMasterInstance) => Promise<void> } }): Promise<void> => {
  danceMaster!.mingling = false
  resetDanceMaster(dance.formation)
  await goHome(danceMaster!)
  await dance.executor.do(danceMaster!)
}
