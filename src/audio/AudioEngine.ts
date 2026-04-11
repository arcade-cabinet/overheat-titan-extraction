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

  private _grinderNode: OscillatorNode | null = null
  private _grinderGain: GainNode | null = null
  private _grinderNoise: AudioBufferSourceNode | null = null
  private _grinderIsActive: boolean = false

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

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.7

    // Background bus for ducking
    this.bgBus = this.ctx.createGain()
    this.bgBus.gain.value = 1.0
    this.bgBus.connect(this.masterGain)

    this.filterNode = this.ctx.createBiquadFilter()
    this.filterNode.type = 'lowpass'
    this.filterNode.frequency.value = 20000

    this.masterGain.connect(this.filterNode)
    this.filterNode.connect(this.ctx.destination)

    // Init grinder synth
    this._grinderNode = this.ctx.createOscillator()
    this._grinderNode.type = 'sawtooth'
    this._grinderNode.frequency.value = 100
    
    // Add white noise for grit
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    this._grinderNoise = this.ctx.createBufferSource()
    this._grinderNoise.buffer = noiseBuffer
    this._grinderNoise.loop = true

    this._grinderGain = this.ctx.createGain()
    this._grinderGain.gain.value = 0

    this._grinderNode.connect(this._grinderGain)
    this._grinderNoise.connect(this._grinderGain)
    this._grinderGain.connect(this.bgBus)
    
    this._grinderNode.start()
    this._grinderNoise.start()

    this._initialized = true
  }

  setGrinding(isActive: boolean, heatPercent: number) {
    if (!this._initialized || !this._grinderGain || !this._grinderNode || !this.ctx) return
    
    const targetGain = isActive ? 0.15 : 0
    const time = this.ctx.currentTime

    // Ramp gain
    if (isActive && !this._grinderIsActive) {
      this._grinderGain.gain.setTargetAtTime(targetGain, time, 0.05)
    } else if (!isActive && this._grinderIsActive) {
      this._grinderGain.gain.setTargetAtTime(0, time, 0.1)
    }
    
    this._grinderIsActive = isActive

    // Modulate pitch and filter with heat
    if (isActive) {
      const baseFreq = 120 + heatPercent * 2.5
      this._grinderNode.frequency.setTargetAtTime(baseFreq, time, 0.1)
      
      // Add distortion if very hot
      if (heatPercent > 80 && this.filterNode) {
        this.filterNode.frequency.setTargetAtTime(1000 + Math.random() * 2000, time, 0.05)
      }
    }
  }

  setVolume(v: number) {
    if (!this._initialized || !this.masterGain || !this.ctx) return
    this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.1)
  }

  setPauseFilter(paused: boolean) {
    if (!this._initialized || !this.filterNode || !this.ctx) return
    const freq = paused ? 300 : 20000
    this.filterNode.frequency.setTargetAtTime(freq, this.ctx!.currentTime, 0.3)
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
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
    osc.type = type
    osc.frequency.value = freq

    const attack = Math.min(0.02, duration * 0.1)
    const release = duration - attack

    gain.gain.setValueAtTime(0.001, this.ctx!.currentTime)
    gain.gain.exponentialRampToValueAtTime(gainVal, this.ctx!.currentTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + attack + release)

    osc.connect(gain)
    gain.connect(bus)
    osc.start()
    osc.stop(this.ctx!.currentTime + duration + 0.1)
  }

  playMechStep() {
    this._makeOsc('sine', 60, 0.3, 0.2)
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
    const osc = this.ctx!.createOscillator()
    const gain = this.ctx!.createGain()
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
    const gain = this.ctx!.createGain()
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
    const humOsc = this.ctx!.createOscillator()
    const humGain = this.ctx!.createGain()
    humOsc.type = 'sine'
    humOsc.frequency.value = siloConfig.humBaseFrequency
    humGain.gain.value = siloConfig.humBaseGain

    // Slow LFO for organic pulsing
    const lfo = this.ctx!.createOscillator()
    const lfoGain = this.ctx!.createGain()
    lfo.frequency.value = siloConfig.humLfoFrequency
    lfoGain.gain.value = siloConfig.humLfoGain
    lfo.connect(lfoGain)
    lfoGain.connect(humGain.gain)

    humOsc.connect(humGain)
    humGain.connect(this.bgBus!)
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
    const node = this.ctx!.createScriptProcessor(bufferSize, 1, 1)
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
    gain.connect(this.bgBus!)
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
