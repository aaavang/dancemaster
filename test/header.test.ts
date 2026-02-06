import { describe, it, expect, beforeEach } from 'vitest'
import { HeaderManager } from '../src/header'

describe('HeaderManager', () => {
  let el: HTMLDivElement
  let header: HeaderManager

  beforeEach(() => {
    el = document.createElement('div')
    header = new HeaderManager(el)
  })

  it('update(text) sets innerHTML with text and beat 1', () => {
    header.update('Advance and Retire')
    expect(el.innerHTML).toBe('Advance and Retire - 1')
  })

  it('update() with no arg keeps previous text', () => {
    header.update('Swing')
    header.update()
    expect(el.innerHTML).toBe('Swing - 1')
  })

  it('freeze() prevents text from changing', () => {
    header.update('Original')
    header.freeze()
    header.update('New')
    expect(el.innerHTML).toBe('Original - 1')
  })

  it('unfreeze() re-enables text changes', () => {
    header.update('Original')
    header.freeze()
    header.update('Ignored')
    header.unfreeze()
    header.update('Updated')
    expect(el.innerHTML).toBe('Updated - 1')
  })

  it('tick() increments beat counter and updates display', () => {
    header.update('Move')
    header.tick()
    expect(el.innerHTML).toBe('Move - 2')
  })

  it('tick() wraps beat after 8 ticks back to 1', () => {
    header.update('Move')
    for (let i = 0; i < 8; i++) {
      header.tick()
    }
    // count=8, (8 % 8) + 1 = 1
    expect(el.innerHTML).toBe('Move - 1')
  })

  it('resetCount() resets beat counter to 0', () => {
    header.update('Move')
    header.tick()
    header.tick()
    header.resetCount()
    header.update()
    expect(el.innerHTML).toBe('Move - 1')
  })

  it('clear() sets innerHTML to empty string', () => {
    header.update('Something')
    header.clear()
    expect(el.innerHTML).toBe('')
  })
})
