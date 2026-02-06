import { goHome, mingle, positionManager } from './moves'
import { DancerLayouts, Directions, Formations, Positions, Relationships } from './enums'
import { Dancer } from './dancer'
import type { HeaderManager } from './header'
import type { DanceMasterInstance, DanceMasterState, Direction, Formation, MoveFunction, Position, Relationship } from './types'

export class DanceMaster implements DanceMasterInstance {
  state: DanceMasterState
  mingling: boolean
  minglingTimelinesPromise: Promise<unknown[]> | null
  moveSet: MoveFunction[]
  danceFloor: HTMLDivElement
  private headerManager: HeaderManager

  constructor(options: { formation: Formation; danceFloor: HTMLDivElement; headerManager: HeaderManager }) {
    this.state = {
      formation: options.formation,
      dancers: {},
    }

    this.mingling = false
    this.minglingTimelinesPromise = null
    this.moveSet = []

    this.danceFloor = options.danceFloor
    this.headerManager = options.headerManager

    const centerElem = document.createElement('div')
    centerElem.id = 'center-point'
    this.danceFloor.appendChild(centerElem)
    centerElem.style.left = `${window.innerWidth / 2 - 5}px`
    centerElem.style.top = `${window.innerHeight / 2 - 5}px`

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
      this.headerManager.update('Stop Mingling')
      await this.minglingTimelinesPromise
      await goHome(this)
    }
    try {
      await move(this)
    } catch (e) {
      console.error(e)
      this.headerManager.update((e as Error).message)
      setTimeout(() => {
        this.headerManager.clear()
      }, 2000)
    }
    this.normalizeDancerRotations()
  }

  async run(): Promise<void> {
    for (const move of this.moveSet) {
      await move(this)
      this.normalizeDancerRotations()
    }
    this.headerManager.update('Done')
  }

  normalizeDancerRotations(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      dancer.normalizeRotation()
    }
  }

  clear(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      dancer.remove()
    }
  }

  adjustPositions(): void {
    for (const dancer of Object.values(this.state.dancers)) {
      dancer.adjustPosition(this.state.formation)
    }

    const centerElem = document.getElementById('center-point')!
    centerElem.style.left = `${window.innerWidth / 2 - 5}px`
    centerElem.style.top = `${window.innerHeight / 2 - 5}px`
  }

  async reset(): Promise<void> {
    for (const dancer of Object.values(this.state.dancers)) {
      dancer.reset(this.state.formation)
    }
  }

  createDancer(color: string, formation: Formation, role: Position): void {
    this.state.dancers[role] = new Dancer(
      color,
      formation,
      role,
      this.danceFloor,
      positionManager,
      this.isLead.bind(this),
      this.getPositionNameFromRelationship.bind(this),
    )
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
