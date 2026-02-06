import { goHome, mingle, normalizeRotation, positionManager } from './moves'
import { DancerLayouts, Directions, FormationGroups, Formations, Positions, Relationships } from './enums'
import { headerManager } from './header'
import type { DanceMasterInstance, DanceMasterState, Direction, Formation, MoveFunction, Position, Relationship } from './types'

const DANCER_NAMES = [
  'Alex', 'Davin', 'Emmalee', 'Justin', 'Grace', 'Danielle', 'Sam', 'Katie',
  'Paul', 'Stephen', 'Sharon', 'Amy', 'Ed', 'Elaine', 'Elvira', 'Hailey',
  'Gaby', 'Dawn', 'Tim', 'Liam', 'Emma', 'Noah', 'Olivia', 'Aiden', 'Sophia',
  'Mason', 'Isabella', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'James', 'Harper',
  'Benjamin', 'Evelyn', 'Elijah', 'Charlotte', 'William', 'Abigail', 'Alexander',
  'Ella', 'Henry', 'Chloe', 'Sebastian', 'Madison', 'Jackson', 'Scarlett',
  'Mateo', 'Aria', 'Daniel', 'Grace', 'Matthew', 'Zoe', 'Joseph', 'Riley',
  'David', 'Lily', 'Samuel', 'Avery', 'David', 'Victoria', 'John', 'Camila',
  'Gabriel', 'Penelope', 'Carter', 'Layla', 'Owen', 'Mila', 'Wyatt', 'Ellie', 'Jack',
]

export class DanceMaster implements DanceMasterInstance {
  state: DanceMasterState
  mingling: boolean
  minglingTimelinesPromise: Promise<unknown[]> | null
  moveSet: MoveFunction[]
  danceFloor: HTMLDivElement

  constructor(options: { formation: Formation }) {
    this.state = {
      formation: options.formation,
      dancers: {},
    }

    this.mingling = false
    this.minglingTimelinesPromise = null
    this.moveSet = []

    this.danceFloor = document.getElementById('dance-floor') as HTMLDivElement

    const centerElem = document.createElement('div')
    centerElem.id = 'center-point'
    this.danceFloor.appendChild(centerElem)
    centerElem.style.left = `${positionManager.center.x - 5}px`
    centerElem.style.top = `${positionManager.center.y - 5}px`

    switch (options.formation) {
      case Formations.EIGHT_HAND_SQUARE:
        this.createDancer('red', options.formation, Positions.FIRST_TOP_LEAD)
        this.createDancer('blue', options.formation, Positions.FIRST_TOP_FOLLOW)
        this.createDancer('green', options.formation, Positions.SECOND_TOP_LEAD)
        this.createDancer('yellow', options.formation, Positions.SECOND_TOP_FOLLOW)
        this.createDancer('purple', options.formation, Positions.FIRST_SIDE_LEAD)
        this.createDancer('orange', options.formation, Positions.FIRST_SIDE_FOLLOW)
        this.createDancer('pink', options.formation, Positions.SECOND_SIDE_LEAD)
        this.createDancer('brown', options.formation, Positions.SECOND_SIDE_FOLLOW)
        break
      case Formations.TWO_FACING_TWO:
        this.createDancer('red', options.formation, Positions.FIRST_TOP_LEAD)
        this.createDancer('blue', options.formation, Positions.FIRST_TOP_FOLLOW)
        this.createDancer('green', options.formation, Positions.SECOND_TOP_LEAD)
        this.createDancer('yellow', options.formation, Positions.SECOND_TOP_FOLLOW)
        break
      default:
        throw new Error('invalid formation')
    }
  }

  async runMove(move: MoveFunction): Promise<void> {
    if (this.mingling && move !== mingle) {
      this.mingling = false
      headerManager.update('Stop Mingling')
      await this.minglingTimelinesPromise
      await goHome(this)
    }
    try {
      await move(this)
    } catch (e) {
      console.error(e)
      headerManager.update((e as Error).message)
      setTimeout(() => {
        headerManager.clear()
      }, 2000)
    }
    this.normalizeDancerRotations()
  }

  async run(): Promise<void> {
    for (const move of this.moveSet) {
      await move(this)
      this.normalizeDancerRotations()
    }
    headerManager.update('Done')
  }

  normalizeDancerRotations(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      const normalizedRotation = normalizeRotation(dancer.arrowElem)
      dancer.arrowElem.style.transform = `rotate(${normalizedRotation}deg)`
      dancer.currentOffset.rotation = normalizedRotation
    }
  }

  clear(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      dancer.elem.remove()
    }
  }

  adjustPositions(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      const position = positionManager.get(this.state.formation, dancer.role)
      dancer.elem.style.left = `${position.x}px`
      dancer.elem.style.top = `${position.y}px`
    }

    const centerElem = document.getElementById('center-point')!
    centerElem.style.left = `${positionManager.center.x - 5}px`
    centerElem.style.top = `${positionManager.center.y - 5}px`
  }

  async reset(): Promise<void> {
    for (const dancer of Object.values(this.state.dancers)) {
      const pos = positionManager.get(this.state.formation, dancer.role)
      dancer.elem.style.left = `${pos.x}px`
      dancer.elem.style.top = `${pos.y}px`
      dancer.elem.style.transform = `rotate(${pos.rotation}deg)`
      dancer.currentNamedPosition = dancer.role
      dancer.currentOffset = {
        x: 0,
        y: 0,
        rotation: pos.rotation,
      }
      dancer.facingPartner = false
      dancer.turnedAround = false
    }
  }

  createDancer(color: string, formation: Formation, role: Position): void {
    const name = DANCER_NAMES[Math.floor(Math.random() * DANCER_NAMES.length)]
    const pos = positionManager.get(formation, role)
    const dancerElem = document.createElement('div')
    dancerElem.id = role
    dancerElem.classList.add('dancer')
    dancerElem.style.left = `${pos.x}px`
    dancerElem.style.top = `${pos.y}px`

    const label = document.createElement('div')
    label.classList.add('label')
    label.innerHTML = `${name} <br/> ${role}`
    dancerElem.appendChild(label)

    const arrow = document.createElement('div')
    arrow.classList.add('arrow')
    arrow.id = `arrow-${role}`
    arrow.innerHTML = '\u2193'
    arrow.style.backgroundColor = color
    arrow.style.transform = `rotate(${pos.rotation}deg)`
    dancerElem.appendChild(arrow)
    dancerElem.onclick = () => {
      const partner = this.getPositionNameFromRelationship(role, Relationships.PARTNER)
      const corner = this.getPositionNameFromRelationship(role, Relationships.CORNER)
      const contrary = this.getPositionNameFromRelationship(role, Relationships.CONTRARY)
      const arrowRotation = arrow.style.transform
      const facingPartner = this.state.dancers[role].facingPartner

      console.log(
        `My Role: ${role}\nPartner: ${partner}\nCorner: ${corner}\nContrary: ${contrary}\nArrow Rotation: ${arrowRotation}\nFacing Partner: ${facingPartner}`,
      )
    }

    this.state.dancers[role] = {
      name,
      color,
      elem: dancerElem,
      role,
      targetId: `#${role}`,
      arrowId: `#${arrow.id}`,
      arrowElem: arrow,
      position: pos,
      currentNamedPosition: role,
      group: FormationGroups[formation][role],
      currentOffset: {
        x: 0,
        y: 0,
        rotation: pos.rotation,
      },
      facingPartner: false,
      turnedAround: false,
    }

    this.danceFloor.appendChild(dancerElem)
  }

  getNextPositionNameOfSameRole(direction: Direction, role: Position): Position {
    switch (this.state.formation) {
      case Formations.EIGHT_HAND_SQUARE: {
        const layout = DancerLayouts[this.state.formation] as readonly string[]
        const positionIndex = layout.indexOf(role)
        const numberOfPositions = layout.length
        let nextIndex =
          (direction === Directions.RIGHT ? positionIndex + 2 : positionIndex - 2) % numberOfPositions
        nextIndex = ((nextIndex % numberOfPositions) + numberOfPositions) % numberOfPositions
        return layout[nextIndex] as Position
      }
      default:
        throw new Error('invalid formation')
    }
  }

  getNextPosition(direction: Direction, role: Position): Position {
    switch (this.state.formation) {
      case Formations.EIGHT_HAND_SQUARE: {
        const layout = DancerLayouts[this.state.formation] as readonly string[]
        const positionIndex = layout.indexOf(role)
        const numberOfPositions = layout.length
        let nextIndex =
          (direction === Directions.RIGHT ? positionIndex + 1 : positionIndex - 1) % numberOfPositions
        nextIndex = ((nextIndex % numberOfPositions) + numberOfPositions) % numberOfPositions
        return layout[nextIndex] as Position
      }
      default:
        throw new Error('invalid formation')
    }
  }

  isLead(role: Position): boolean {
    switch (this.state.formation) {
      case Formations.TWO_FACING_TWO:
      case Formations.EIGHT_HAND_SQUARE: {
        const layout = DancerLayouts[this.state.formation] as readonly string[]
        return layout.indexOf(role) % 2 === 0
      }
      default:
        throw new Error('invalid formation')
    }
  }

  getPositionNameFromRelationship(currentPosition: Position, targetRelationship: Relationship): Position {
    const layout = DancerLayouts[this.state.formation as keyof typeof DancerLayouts] as readonly string[]
    const positionIndex = layout.indexOf(currentPosition)
    const numberOfPositions = layout.length
    const isLead = positionIndex % 2 === 0
    let nextIndex: number
    switch (this.state.formation) {
      case Formations.EIGHT_HAND_SQUARE:
        switch (targetRelationship) {
          case Relationships.PARTNER:
            nextIndex = isLead ? positionIndex + 1 : positionIndex - 1
            break
          case Relationships.CORNER:
            nextIndex = isLead ? positionIndex - 1 : positionIndex + 1
            break
          case Relationships.CONTRARY:
          case Relationships.OPPOSITE:
            nextIndex = isLead ? positionIndex - 3 : positionIndex + 3
            break
          default:
            throw new Error('invalid relationship')
        }
        break
      case Formations.TWO_FACING_TWO:
        switch (targetRelationship) {
          case Relationships.PARTNER:
            nextIndex = isLead ? positionIndex + 1 : positionIndex - 1
            break
          case Relationships.OPPOSITE:
          case Relationships.CORNER:
            nextIndex = isLead ? positionIndex - 1 : positionIndex + 1
            break
          default:
            nextIndex = positionIndex
            break
        }
        break
      default:
        throw new Error('invalid formation')
    }
    nextIndex = ((nextIndex % numberOfPositions) + numberOfPositions) % numberOfPositions
    return layout[nextIndex] as Position
  }
}
