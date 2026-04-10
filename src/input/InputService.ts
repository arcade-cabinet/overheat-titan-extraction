export const inputState = {
  move: { x: 0, y: 0 }, // Normalized -1 to 1
  look: { x: 0, y: 0 }, // Normalized -1 to 1 (for mobile stick)
  pointerLook: { x: 0, y: 0 }, // Raw pointer delta (for desktop mouse)
  grind: false,
  dash: false,
  tractor: false,
  tractorDownThisFrame: false, // For single-click events
  tractorUpThisFrame: false,
}

// Global listeners for desktop keyboard/mouse fallback
const keys: Record<string, boolean> = {}

function updateDesktopState() {
  const forward = keys.KeyW || keys.ArrowUp ? 1 : 0
  const backward = keys.KeyS || keys.ArrowDown ? 1 : 0
  const left = keys.KeyA || keys.ArrowLeft ? 1 : 0
  const right = keys.KeyD || keys.ArrowRight ? 1 : 0

  inputState.move.x = right - left
  inputState.move.y = backward - forward
  inputState.dash = !!(keys.ShiftLeft || keys.ShiftRight)

  // Normalize if diagonal
  const length = Math.sqrt(inputState.move.x ** 2 + inputState.move.y ** 2)
  if (length > 1) {
    inputState.move.x /= length
    inputState.move.y /= length
  }
}

export function initDesktopInput() {
  const down = (e: KeyboardEvent) => {
    keys[e.code] = true
    updateDesktopState()
  }
  const up = (e: KeyboardEvent) => {
    keys[e.code] = false
    updateDesktopState()
  }
  const blur = () => {
    Object.keys(keys).forEach((k) => {
      delete keys[k]
    })
    updateDesktopState()
  }

  const mouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement) {
      inputState.pointerLook.x += e.movementX
      inputState.pointerLook.y += e.movementY
    }
  }

  const mouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      // Left click
      inputState.tractor = true
      inputState.tractorDownThisFrame = true
    }
    if (e.button === 2) {
      // Right click
      inputState.grind = true
    }
  }

  const mouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      inputState.tractor = false
      inputState.tractorUpThisFrame = true
    }
    if (e.button === 2) {
      inputState.grind = false
    }
  }

  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', blur)
  document.addEventListener('mousemove', mouseMove)
  window.addEventListener('mousedown', mouseDown)
  window.addEventListener('mouseup', mouseUp)

  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', blur)
    document.removeEventListener('mousemove', mouseMove)
    window.removeEventListener('mousedown', mouseDown)
    window.removeEventListener('mouseup', mouseUp)
  }
}

export function resetFrameEvents() {
  inputState.pointerLook.x = 0
  inputState.pointerLook.y = 0
  inputState.tractorDownThisFrame = false
  inputState.tractorUpThisFrame = false
}
