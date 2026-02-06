import { Formations } from '../enums'
import type { Formation } from '../types'
import type { CeiliDance, FigureDance } from '../dance'

export { threeTunes } from './threeTunes'
export { bonfireDance } from './bonfireDance'

import { threeTunes } from './threeTunes'
import { bonfireDance } from './bonfireDance'

export const dances: Record<string, { name: string; formation: Formation; executor: FigureDance | CeiliDance }> = {
  'The Three Tunes': {
    name: 'The Three Tunes',
    formation: Formations.EIGHT_HAND_SQUARE,
    executor: threeTunes,
  },
  'Bonfire Dance': {
    name: 'Bonfire Dance',
    formation: Formations.EIGHT_HAND_SQUARE,
    executor: bonfireDance,
  },
}
