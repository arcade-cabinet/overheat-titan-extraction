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
}

export const audioManager = new AudioEngine()
