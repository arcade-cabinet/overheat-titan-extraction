import gameConfig from '../config.json'

const { silo: siloConfig, audio: audioConfig } = gameConfig

class AudioEngine {
  _initialized: boolean
  ctx: AudioContext | null
  masterGain: GainNode | null
  bgBus: GainNode | null
  filterNode: BiquadFilterNode | null

  private _siloHum: {
    osc: OscillatorNode
    gain: GainNode
    lfo: OscillatorNode
    lfoGain: GainNode
  } | null = null

  private _thrusterNode: OscillatorNode | null = null
  private _thrusterGain: GainNode | null = null
  private _thrusterLevel: number = 0

  constructor() {
    this._initialized = false
    this.ctx = null
    this.masterGain = null
    this.bgBus = null
    this.filterNode = null
  }

  init() {
    if (this._initialized) return
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    this.ctx = new AudioContextClass()

    this.masterGain = (this.ctx as any).createGain()
    this.masterGain!.gain.value = 0.7

    // Background bus for ducking
    this.bgBus = (this.ctx as any).createGain()
    this.bgBus!.gain.value = 1.0
    this.bgBus!.connect(this.masterGain!)

    this.filterNode = (this.ctx as any).createBiquadFilter()
    this.filterNode!.type = 'lowpass'
    this.filterNode!.frequency.value = 20000

    this.masterGain!.connect(this.filterNode!)
    this.filterNode!.connect((this.ctx as any).destination)
    this._initialized = true
  }

  setVolume(v: number) {
    if (!this._initialized || !this.masterGain || !this.ctx) return
    this.masterGain.gain.setTargetAtTime(v, (this.ctx as any).currentTime, 0.1)
  }

  setPauseFilter(paused: boolean) {
    if (!this._initialized || !this.filterNode || !this.ctx) return
    const freq = paused ? 300 : 20000
    this.filterNode.frequency.setTargetAtTime(freq, (this.ctx as any).currentTime, 0.3)
  }

  _makeOsc(
    type: OscillatorType,
    freq: number,
    gainVal: number,
    duration: number,
    destBus: GainNode | null = null
  ) {
    if (!this._initialized || !this.ctx) return
    const bus = destBus || this.bgBus
    if (!bus) return
    const osc = (this.ctx as any).createOscillator()
    const gain = (this.ctx as any).createGain()
    osc.type = type
    osc.frequency.value = freq

    const attack = Math.min(0.02, duration * 0.1)
    const release = duration - attack

    gain.gain.setValueAtTime(0.001, (this.ctx as any).currentTime)
    gain.gain.exponentialRampToValueAtTime(gainVal, (this.ctx as any).currentTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, (this.ctx as any).currentTime + attack + release)

    osc.connect(gain)
    gain.connect(bus)
    osc.start()
    osc.stop((this.ctx as any).currentTime + duration + 0.1)
  }

  playMechStep() {
    this._makeOsc('sine', 60, 0.3, 0.2)
  }

  playGrind(heatPercent: number) {
    if (!this._initialized) return
    const baseFreq = 80 + heatPercent * 2
    this._makeOsc('sawtooth', baseFreq, 0.08, 0.1)
  }

  playAlarm() {
    if (!this._initialized || !this.ctx || !this.bgBus || !this.masterGain) return

    // Duck BG bus dynamically
    this.bgBus.gain.cancelScheduledValues(this.ctx.currentTime)
    this.bgBus.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.05)
    this.bgBus.gain.setTargetAtTime(1.0, this.ctx.currentTime + 0.6, 0.5)

    // Play alarm directly on master to avoid ducking itself
    this._makeOsc('square', 880, 0.15, 0.2, this.masterGain)
    setTimeout(() => this._makeOsc('square', 660, 0.15, 0.2, this.masterGain), 250)
  }

  playSell() {
    this._makeOsc('sine', 1200, 0.2, 0.3)
  }

  playPowerUp() {
    if (!this._initialized || !this.ctx || !this.masterGain) return
    const osc = (this.ctx as any).createOscillator()
    const gain = (this.ctx as any).createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 1.5)
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.3)
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 1.5)
  }

  playMeltdown() {
    if (!this._initialized || !this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const gain = (this.ctx as any).createGain()
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

  // Dissonant chord — rare isotope sell confirmation (tunable via config.audio.rareSell)
  playRareSell() {
    if (!this._initialized) return
    for (const osc of audioConfig.rareSell.oscillators) {
      this._makeOsc('sine', osc.frequency, osc.gain, osc.duration)
    }
  }

  initSiloHum() {
    if (!this._initialized || this._siloHum) return

    // Low sine oscillator for hum
    const humOsc = (this.ctx as any).createOscillator()
    const humGain = (this.ctx as any).createGain()
    humOsc.type = 'sine'
    humOsc.frequency.value = siloConfig.humBaseFrequency
    humGain.gain.value = siloConfig.humBaseGain

    // Slow LFO for organic pulsing
    const lfo = (this.ctx as any).createOscillator()
    const lfoGain = (this.ctx as any).createGain()
    lfo.frequency.value = siloConfig.humLfoFrequency
    lfoGain.gain.value = siloConfig.humLfoGain
    lfo.connect(lfoGain)
    lfoGain.connect(humGain.gain)

    humOsc.connect(humGain)
    humGain.connect(this.bgBus)
    humOsc.start()
    lfo.start()
    this._siloHum = { osc: humOsc, gain: humGain, lfo, lfoGain }
  }

  setSiloHumDistance(distance: number) {
    if (!this._siloHum || !this.ctx) return
    // Attenuate by distance — full at 0, silent at humMaxDistance
    const vol = Math.max(0, 1 - distance / siloConfig.humMaxDistance) * siloConfig.humMaxVol
    this._siloHum.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.3)
  }

  initThruster() {
    if (!this._initialized || this._thrusterGain || !this.ctx) return
    const bufferSize = 4096
    // createScriptProcessor is deprecated but widely supported; use AudioWorklet in M2
    // eslint-disable-next-line no-undef
    const node = (this.ctx as any).createScriptProcessor(bufferSize, 1, 1)
    node.onaudioprocess = (e: any) => {
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
    gain.connect(this.bgBus as any)
    this._thrusterGain = gain
    this._thrusterNode = node as any
    this._thrusterLevel = 0
  }

  setThrusterVolume(normalizedSpeed: number) {
    if (!this._thrusterGain || !this.ctx) return
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
