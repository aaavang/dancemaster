import { FigureDance } from './dance'
import {
  Moves,
  quarterCircleLeft,
  twoThreesToTheLeft,
  quarterCircleRight,
  twoThreesToTheRight,
  followsFastInnerCircleLeft,
  clapTwice,
  fastSwitchWithPartner,
  switchWithPartner,
  leadsFastInnerCircleLeft,
} from '../moves'
import type { MoveFunction } from '../types'

export const threeTunes = new FigureDance('The Three Tunes')
  .withFigure(
    'Right Right/Left',
    new Moves([
      quarterCircleLeft,
      twoThreesToTheLeft,
      quarterCircleRight,
      twoThreesToTheRight,
      quarterCircleRight,
      twoThreesToTheRight,
      quarterCircleLeft,
      twoThreesToTheLeft,
    ] as MoveFunction[]),
  )
  .withFigure(
    'Rings',
    new Moves([
      followsFastInnerCircleLeft,
      clapTwice,
      fastSwitchWithPartner,
      switchWithPartner,
      leadsFastInnerCircleLeft,
      clapTwice,
      fastSwitchWithPartner,
      switchWithPartner,
    ] as MoveFunction[]),
  )
  .withSteps((figureDance) => {
    return [figureDance.figures['Right Right/Left'], figureDance.figures['Rings']]
  })
