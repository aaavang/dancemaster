import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../src/header', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/header')>()
  return {
    ...mod,
    headerManager: new mod.HeaderManager(document.createElement('div')),
  }
})

import { switchWithPartner } from '../../src/moves/partner'
import { positionManager } from '../../src/moves/utils'
import { DanceMaster } from '../../src/danceMaster'
import { HeaderManager } from '../../src/header'
import { Formations, Positions } from '../../src/enums'

describe('switchWithPartner', () => {
  let danceMaster: DanceMaster

  beforeEach(() => {
    vi.useFakeTimers()
    positionManager.recalculate(1000, 800)
    danceMaster = new DanceMaster({
      formation: Formations.TWO_FACING_TWO,
      danceFloor: document.createElement('div'),
      headerManager: new HeaderManager(document.createElement('div')),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dancers swap to their partner\'s position while maintaining rotation', async () => {
    const { dancers } = danceMaster.state

    // Verify initial state: each dancer starts at their home position
    for (const dancer of Object.values(dancers)) {
      expect(dancer.currentNamedPosition).toBe(dancer.role)
    }

    // Record initial rotations
    const initialRotations: Record<string, number> = {}
    for (const [role, dancer] of Object.entries(dancers)) {
      initialRotations[role] = dancer.currentPose.rotation
    }

    // Run the move and advance timers past animation duration (4 beats × 500ms = 2000ms)
    const promise = switchWithPartner(danceMaster)
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    // Each dancer should now occupy their partner's named position
    expect(dancers[Positions.FIRST_TOP_LEAD].currentNamedPosition).toBe(Positions.FIRST_TOP_FOLLOW)
    expect(dancers[Positions.FIRST_TOP_FOLLOW].currentNamedPosition).toBe(Positions.FIRST_TOP_LEAD)
    expect(dancers[Positions.SECOND_TOP_LEAD].currentNamedPosition).toBe(Positions.SECOND_TOP_FOLLOW)
    expect(dancers[Positions.SECOND_TOP_FOLLOW].currentNamedPosition).toBe(Positions.SECOND_TOP_LEAD)

    // Rotation should be maintained
    for (const [role, dancer] of Object.entries(dancers)) {
      expect(dancer.currentPose.rotation).toBe(initialRotations[role])
    }
  })
})
