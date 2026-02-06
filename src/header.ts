export class HeaderManager {
  private count = 0
  private text = ''
  private frozen = false
  private readonly el: HTMLElement

  constructor(el: HTMLElement) {
    this.el = el
  }

  freeze(): void {
    this.frozen = true
  }

  unfreeze(): void {
    this.frozen = false
  }

  update(text?: string): void {
    if (text && !this.frozen) {
      this.text = text
    }
    this.el.innerHTML = `${this.text} - ${(this.count % 8) + 1}`
  }

  clear(): void {
    this.el.innerHTML = ''
  }

  tick(): void {
    this.count++
    this.update()
  }

  resetCount(): void {
    this.count = 0
  }
}

export const headerManager = new HeaderManager(document.getElementById('header')!)
