import { FormationGroups, Relationships } from './enums'
import type { Direction, Formation, GroupName, Point, Pose, Position, Relationship } from './types'
import { Directions } from './enums'
import type { PositionManager } from './moves/utils'

export const DANCER_NAMES = [
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

export class Dancer {
  name: string
  color: string
  elem: HTMLDivElement
  role: Position
  targetId: string
  arrowId: string
  arrowElem: HTMLDivElement
  position: Pose
  currentNamedPosition: Position
  group: GroupName
  currentPose: Pose
  facingPartner: boolean
  turnedAround: boolean

  private positionManager: PositionManager

  constructor(
    color: string,
    formation: Formation,
    role: Position,
    danceFloor: HTMLDivElement,
    positionManager: PositionManager,
    isLead: (role: Position) => boolean,
    getRelationship: (currentPosition: Position, targetRelationship: Relationship) => Position,
  ) {
    this.positionManager = positionManager

    this.name = DANCER_NAMES[Math.floor(Math.random() * DANCER_NAMES.length)]
    this.color = color
    this.role = role
    this.targetId = `#${role}`
    this.arrowId = `#arrow-${role}`
    this.currentNamedPosition = role
    this.group = FormationGroups[formation][role]
    this.facingPartner = false
    this.turnedAround = false

    const pos = positionManager.get(formation, role)
    this.position = pos
    this.currentPose = {
      x: 0,
      y: 0,
      rotation: pos.rotation,
    }

    const dancerElem = document.createElement('div')
    dancerElem.id = role
    dancerElem.classList.add('dancer')
    dancerElem.style.left = `${pos.x}px`
    dancerElem.style.top = `${pos.y}px`

    const label = document.createElement('div')
    label.classList.add('label')
    label.innerHTML = `${this.name} <br/> ${role}`
    dancerElem.appendChild(label)

    const arrow = document.createElement('div')
    arrow.classList.add('arrow')
    arrow.id = `arrow-${role}`
    arrow.innerHTML = '\u2193'
    arrow.style.backgroundColor = color
    arrow.style.transform = `rotate(${pos.rotation}deg)`
    dancerElem.appendChild(arrow)

    dancerElem.onclick = () => {
      const partner = getRelationship(role, Relationships.PARTNER)
      const corner = getRelationship(role, Relationships.CORNER)
      const contrary = getRelationship(role, Relationships.CONTRARY)
      const arrowRotation = arrow.style.transform
      const facingPartner = this.facingPartner

      console.log(
        `My Role: ${role}\nPartner: ${partner}\nCorner: ${corner}\nContrary: ${contrary}\nArrow Rotation: ${arrowRotation}\nFacing Partner: ${facingPartner}`,
      )
    }

    this.elem = dancerElem
    this.arrowElem = arrow

    danceFloor.appendChild(dancerElem)
  }

  normalizeRotation(): void {
    const match = this.arrowElem.style.transform.match(/rotate\((.+)deg\)/)
    let rotation = parseInt(match![1])
    rotation = rotation % 360
    if (rotation < 0) {
      rotation += 360
    }
    this.arrowElem.style.transform = `rotate(${rotation}deg)`
    this.currentPose.rotation = rotation
  }

  getFacingDirection(): Direction {
    const match = this.arrowElem.style.transform.match(/rotate\((.+)deg\)/)
    let rotation = parseInt(match![1])
    rotation = rotation % 360
    if (rotation < 0) {
      rotation += 360
    }
    if (rotation >= 46 && rotation < 135) {
      return Directions.LEFT
    } else if (rotation >= 135 && rotation < 225) {
      return Directions.UP
    } else if (rotation >= 225 && rotation < 315) {
      return Directions.RIGHT
    } else {
      return Directions.DOWN
    }
  }

  getTranslation(): Point {
    const style = window.getComputedStyle(this.elem)
    const transform = style.transform

    if (transform === 'none' || !transform) {
      return { x: 0, y: 0 }
    }

    const matrixMatch = transform.match(/matrix.*\((.+)\)/)

    if (matrixMatch) {
      const values = matrixMatch[1].split(', ').map(parseFloat)

      if (transform.startsWith('matrix3d')) {
        return { x: values[12], y: values[13] }
      } else {
        return { x: values[4], y: values[5] }
      }
    }

    return { x: 0, y: 0 }
  }

  remove(): void {
    this.elem.remove()
  }

  adjustPosition(formation: Formation): void {
    const position = this.positionManager.get(formation, this.role)
    this.elem.style.left = `${position.x}px`
    this.elem.style.top = `${position.y}px`
  }

  reset(formation: Formation): void {
    const pos = this.positionManager.get(formation, this.role)
    this.elem.style.left = `${pos.x}px`
    this.elem.style.top = `${pos.y}px`
    this.elem.style.transform = `rotate(${pos.rotation}deg)`
    this.currentNamedPosition = this.role
    this.currentPose = {
      x: 0,
      y: 0,
      rotation: pos.rotation,
    }
    this.facingPartner = false
    this.turnedAround = false
  }
}
