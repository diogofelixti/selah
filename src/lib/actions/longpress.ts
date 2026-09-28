const HOLD_MS = 500
const MOVE_TOLERANCE = 10

/** Chama onLongPress ao segurar por 500ms, e cancela o clique que viria em seguida. */
export function longpress(node: HTMLElement, onLongPress: () => void) {
  let handler = onLongPress
  let timer: ReturnType<typeof setTimeout> | undefined
  let fired = false
  let startX = 0
  let startY = 0

  const cancel = () => clearTimeout(timer)
  const down = (e: PointerEvent) => {
    fired = false
    startX = e.clientX
    startY = e.clientY
    timer = setTimeout(() => {
      fired = true
      navigator.vibrate?.(15)
      handler()
    }, HOLD_MS)
  }
  const move = (e: PointerEvent) => {
    if (Math.abs(e.clientX - startX) > MOVE_TOLERANCE || Math.abs(e.clientY - startY) > MOVE_TOLERANCE) cancel()
  }
  const click = (e: MouseEvent) => {
    if (fired) {
      e.preventDefault()
      e.stopPropagation()
      fired = false
    }
  }
  const menu = (e: Event) => e.preventDefault()

  node.addEventListener('pointerdown', down)
  node.addEventListener('pointermove', move)
  node.addEventListener('pointerup', cancel)
  node.addEventListener('pointercancel', cancel)
  node.addEventListener('pointerleave', cancel)
  node.addEventListener('click', click, true)
  node.addEventListener('contextmenu', menu)

  return {
    update(next: () => void) {
      handler = next
    },
    destroy() {
      cancel()
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', cancel)
      node.removeEventListener('pointercancel', cancel)
      node.removeEventListener('pointerleave', cancel)
      node.removeEventListener('click', click, true)
      node.removeEventListener('contextmenu', menu)
    },
  }
}
