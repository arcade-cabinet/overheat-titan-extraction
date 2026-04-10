import { useRef, useState } from 'react'
import { inputState } from '../input/InputService'

export function MobileControls() {
  const leftStickRef = useRef(null)
  const rightStickRef = useRef(null)

  const [leftActive, setLeftActive] = useState(false)
  const [rightActive, setRightActive] = useState(false)

  const [leftOrigin, setLeftOrigin] = useState({ x: 0, y: 0 })
  const [rightOrigin, setRightOrigin] = useState({ x: 0, y: 0 })

  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 })
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 })

  const maxRadius = 50

  const handleTouchStart = (e: any, side: any) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const isLeftHalf = touch.clientX < window.innerWidth / 2

      if (side === 'left' && isLeftHalf && !leftActive) {
        setLeftActive(true)
        setLeftOrigin({ x: touch.clientX, y: touch.clientY })
        setLeftPos({ x: touch.clientX, y: touch.clientY })
        leftStickRef.current = touch.identifier
      } else if (side === 'right' && !isLeftHalf && !rightActive) {
        setRightActive(true)
        setRightOrigin({ x: touch.clientX, y: touch.clientY })
        setRightPos({ x: touch.clientX, y: touch.clientY })
        rightStickRef.current = touch.identifier
      }
    }
  }

  const handleTouchMove = (e: any) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]

      if (touch.identifier === leftStickRef.current) {
        let dx = touch.clientX - leftOrigin.x
        let dy = touch.clientY - leftOrigin.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius
          dy = (dy / dist) * maxRadius
        }

        setLeftPos({ x: leftOrigin.x + dx, y: leftOrigin.y + dy })

        // Update input state (normalized)
        inputState.move.x = dx / maxRadius
        inputState.move.y = dy / maxRadius

        // Deadzone
        if (Math.abs(inputState.move.x) < 0.15) inputState.move.x = 0
        if (Math.abs(inputState.move.y) < 0.15) inputState.move.y = 0
      }

      if (touch.identifier === rightStickRef.current) {
        let dx = touch.clientX - rightOrigin.x
        let dy = touch.clientY - rightOrigin.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius
          dy = (dy / dist) * maxRadius
        }

        setRightPos({ x: rightOrigin.x + dx, y: rightOrigin.y + dy })

        // Update input state
        inputState.look.x = dx / maxRadius
        inputState.look.y = dy / maxRadius

        // Deadzone
        if (Math.abs(inputState.look.x) < 0.15) inputState.look.x = 0
        if (Math.abs(inputState.look.y) < 0.15) inputState.look.y = 0
      }
    }
  }

  const handleTouchEnd = (e: any) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]

      if (touch.identifier === leftStickRef.current) {
        setLeftActive(false)
        leftStickRef.current = null
        inputState.move.x = 0
        inputState.move.y = 0
      }

      if (touch.identifier === rightStickRef.current) {
        setRightActive(false)
        rightStickRef.current = null
        inputState.look.x = 0
        inputState.look.y = 0
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50, // above canvas, below overlays
        touchAction: 'none',
        pointerEvents: 'none', // Allow passing through when not touched
      }}
    >
      {/* Left zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          pointerEvents: 'auto',
        }}
        onTouchStart={(e) => handleTouchStart(e, 'left')}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* Right zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          pointerEvents: 'auto',
        }}
        onTouchStart={(e) => handleTouchStart(e, 'right')}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* Joysticks Visuals */}
      {leftActive && (
        <>
          <div
            style={{
              position: 'absolute',
              left: leftOrigin.x - maxRadius,
              top: leftOrigin.y - maxRadius,
              width: maxRadius * 2,
              height: maxRadius * 2,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 204, 0.3)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: leftPos.x - 20,
              top: leftPos.y - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 255, 204, 0.5)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {rightActive && (
        <>
          <div
            style={{
              position: 'absolute',
              left: rightOrigin.x - maxRadius,
              top: rightOrigin.y - maxRadius,
              width: maxRadius * 2,
              height: maxRadius * 2,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 170, 0, 0.3)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: rightPos.x - 20,
              top: rightPos.y - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 170, 0, 0.5)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Action Buttons */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          display: 'flex',
          gap: 20,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onTouchStart={() => {
            inputState.dash = true
          }}
          onTouchEnd={() => {
            inputState.dash = false
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid white',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          DASH
        </button>
        <button
          type="button"
          onTouchStart={() => {
            inputState.tractor = true
            inputState.tractorDownThisFrame = true
          }}
          onTouchEnd={() => {
            inputState.tractor = false
            inputState.tractorUpThisFrame = true
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 255, 204, 0.2)',
            border: '2px solid #00ffcc',
            color: '#00ffcc',
            fontWeight: 'bold',
          }}
        >
          BEAM
        </button>
      </div>
    </div>
  )
}
