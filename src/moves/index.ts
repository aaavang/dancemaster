import type { DanceMasterInstance, MoveFunction } from '../types'

export * from './utils'
export * from './facing'
export * from './partner'
export * from './circle'
export * from './house'
export * from './steps'
export * from './special'

export class Moves {
  moves: MoveFunction[]

  constructor(moves: MoveFunction[] = []) {
    this.moves = moves
  }

  async do(danceMaster: DanceMasterInstance): Promise<void> {
    await this.moves.reduce<Promise<unknown>>(
      (promise, move) => promise.then(() => move(danceMaster)),
      Promise.resolve(),
    )
  }
}
