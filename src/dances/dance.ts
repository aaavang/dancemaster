import type { DanceMasterInstance } from '../types'
import type { Moves } from '../moves'

export class Dance {
  name: string

  constructor(name: string) {
    this.name = name
  }

  async do(_danceMaster: DanceMasterInstance): Promise<void> {
    throw new Error('Must be implemented by subclass')
  }
}

export class FigureDance extends Dance {
  figures: Record<string, Moves> = {}
  bodies: Record<string, Moves> = {}
  steps: (figureDance: FigureDance) => Moves[] = () => {
    console.log('No steps defined')
    return []
  }

  withBody(name: string, body: Moves): this {
    this.bodies[name] = body
    return this
  }

  withFigure(name: string, moveSet: Moves): this {
    this.figures[name] = moveSet
    return this
  }

  withSteps(steps: (figureDance: FigureDance) => Moves[]): this {
    this.steps = steps
    return this
  }

  async do(danceMaster: DanceMasterInstance): Promise<void> {
    const steps = this.steps(this)
    for (const step of steps) {
      await step.do(danceMaster)
      danceMaster.normalizeDancerRotations()
    }
  }
}

export class CeiliDance extends Dance {
  moveSet: Moves | null = null

  withMoves(moveSet: Moves): this {
    this.moveSet = moveSet
    return this
  }

  async do(danceMaster: DanceMasterInstance): Promise<void> {
    await this.moveSet!.do(danceMaster)
  }
}
