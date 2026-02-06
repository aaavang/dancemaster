import type { Formations, Positions, Directions, Relationships, Role } from './enums'
import type { Dancer } from './dancer'

export type Formation = (typeof Formations)[keyof typeof Formations]
export type Position = (typeof Positions)[keyof typeof Positions]
export type Direction = (typeof Directions)[keyof typeof Directions]
export type Relationship = (typeof Relationships)[keyof typeof Relationships]
export type RoleName = (typeof Role)[keyof typeof Role]
export type GroupName = string

export interface Point {
  x: number
  y: number
}

export interface Pose extends Point {
  rotation: number
}

export { type Dancer } from './dancer'

export interface DanceMasterState {
  formation: Formation
  dancers: Record<string, Dancer>
}

export interface DanceMasterInstance {
  state: DanceMasterState
  mingling: boolean
  minglingTimelinesPromise: Promise<unknown[]> | null
  moveSet: MoveFunction[]
  danceFloor: HTMLDivElement
  runMove(move: MoveFunction): Promise<void>
  run(): Promise<void>
  normalizeDancerRotations(): void
  clear(): void
  adjustPositions(): void
  reset(): Promise<void>
  getNextPositionNameOfSameRole(direction: Direction, role: Position): Position
  getNextPosition(direction: Direction, role: Position): Position
  isLead(role: Position): boolean
  getPositionNameFromRelationship(currentPosition: Position, targetRelationship: Relationship): Position
}

export type MoveFunction = (danceMaster: DanceMasterInstance) => Promise<unknown>
