import gameConfig from '../config.json'

const { silo: siloConfig, audio: audioConfig } = gameConfig

class AudioEngine {
  constructor() {
    this._initialized = false
    this.ctx = null
    this.masterGain = null
    this.filterNode = null
  }

  init() {
    if (this._initialized) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.7
    this.filterNode = this.ctx.createBiquadFilter()
    this.filterNode.type = 'lowpass'
    this.filterNode.frequency.value = 20000
    this.masterGain.connect(this.filterNode)
    this.filterNode.connect(this.ctx.destination)
    this._initialized = true
  }

  setVolume(v) {
    if (!this._initialized) return
    this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1)
  }

  setPauseFilter(paused) {
    if (!this._initialized) return
    const freq = paused ? 300 : 20000
    this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.3)
  }

  _makeOsc(type, freq, gainVal, duration) {
    if (!this._initialized) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  playMechStep() {
    this._makeOsc('sine', 60, 0.3, 0.2)
  }

  playGrind(heatPercent) {
    if (!this._initialized) return
    const baseFreq = 80 + heatPercent * 2
    this._makeOsc('sawtooth', baseFreq, 0.08, 0.1)
  }

  playAlarm() {
    if (!this._initialized) return
    this._makeOsc('square', 880, 0.15, 0.2)
    setTimeout(() => this._makeOsc('square', 660, 0.15, 0.2), 250)
  }

  playSell() {
    this._makeOsc('sine', 1200, 0.2, 0.3)
  }

  playPowerUp() {
    if (!this._initialized) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 1.5)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.3)
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 1.5)
  }

  playMeltdown() {
    if (!this._initialized) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 2)
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 2)
  }

  playBlip() {
    this._makeOsc('sine', 800, 0.1, 0.05)
  }

  // Two-tone dissonant chord — rare isotope sell confirmation
  playRareSell() {
    if (!this._initialized) return
    // Root + minor 2nd interval (dissonant) — alien/valuable feel
    this._makeOsc('sine', 1320, 0.25, 0.6)
    this._makeOsc('sine', 1396, 0.15, 0.6)
    // Low thump for weight
    this._makeOsc('sine', 110, 0.3, 0.25)
  }

  initSiloHum() {
    if (!this._initialized || this._siloHum) return

    // Low sine oscillator for hum
    const humOsc = this.ctx.createOscillator()
    const humGain = this.ctx.createGain()
    humOsc.type = 'sine'
    humOsc.frequency.value = siloConfig.humBaseFrequency
    humGain.gain.value = siloConfig.humBaseGain

    // Slow LFO for organic pulsing
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = siloConfig.humLfoFrequency
    lfoGain.gain.value = siloConfig.humLfoGain
    lfo.connect(lfoGain)
    lfoGain.connect(humGain.gain)

    humOsc.connect(humGain)
    humGain.connect(this.masterGain)
    humOsc.start()
    lfo.start()
    this._siloHum = { osc: humOsc, gain: humGain, lfo, lfoGain }
  }

  setSiloHumDistance(distance) {
    if (!this._siloHum) return
    // Attenuate by distance — full at 0, silent at humMaxDistance
    const vol = Math.max(0, 1 - distance / siloConfig.humMaxDistance) * siloConfig.humMaxVol
    this._siloHum.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.3)
  }

  initThruster() {
    if (!this._initialized || this._thrusterGain) return
    const bufferSize = 4096
    // createScriptProcessor is deprecated but widely supported; use AudioWorklet in M2
    // eslint-disable-next-line no-undef
    const node = this.ctx.createScriptProcessor(bufferSize, 1, 1)
    node.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0)
      const level = this._thrusterLevel || 0
      if (level === 0) {
        // Zero-fill when silent — avoid burning CPU on random() for no output
        output.fill(0)
        return
      }
      for (let i = 0; i < output.length; i++) {
        output[i] = (Math.random() * 2 - 1) * level
      }
    }
    const gain = this.ctx.createGain()
    gain.gain.value = 0
    node.connect(gain)
    gain.connect(this.masterGain)
    this._thrusterGain = gain
    this._thrusterNode = node
    this._thrusterLevel = 0
  }

  setThrusterVolume(normalizedSpeed) {
    if (!this._thrusterGain) return
    this._thrusterLevel = normalizedSpeed * audioConfig.thrusterNoiseLevel
    this._thrusterGain.gain.setTargetAtTime(
      normalizedSpeed * audioConfig.thrusterGainLevel,
      this.ctx.currentTime,
      audioConfig.thrusterSmoothTime
    )
  }

  stopSiloHum() {
    if (!this._siloHum) return
    try {
      this._siloHum.osc.stop()
    } catch (_) {
      // already stopped
    }
    try {
      this._siloHum.lfo.stop()
    } catch (_) {
      // already stopped
    }
    try {
      this._siloHum.lfoGain.disconnect()
    } catch (_) {
      // already disconnected
    }
    this._siloHum.gain.disconnect()
    this._siloHum = null
  }

  stopThruster() {
    if (!this._thrusterNode) return
    this._thrusterNode.disconnect()
    this._thrusterGain?.disconnect()
    this._thrusterNode = null
    this._thrusterGain = null
    this._thrusterLevel = 0
  }
}

export const audioManager = new AudioEngine()
