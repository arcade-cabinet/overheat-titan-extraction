export type TelemetryEvent =
  | { name: 'run_started'; variantId: string }
  | { name: 'first_overheat'; runTimeMs: number }
  | { name: 'cube_sold'; value: number }
  | { name: 'meltdown'; runDurationMs: number; finalCredits: number }
  | { name: 'upgrade_purchased'; upgradeType: string; level: number; cost: number }
  | { name: 'contract_completed'; contractType: string; payout: number }
  | { name: 'run_escaped'; runDurationMs: number; finalCredits: number }

class TelemetryService {
  private events: (TelemetryEvent & { timestamp: number })[] = []
  private sessionStartTime = 0
  private _variantId = 'default'
  private hasOverheatedThisRun = false
  
  startRun(variantId: string) {
    this._variantId = variantId
    this.sessionStartTime = Date.now()
    this.hasOverheatedThisRun = false
    this.log({ name: 'run_started', variantId })
  }
  
  log(event: TelemetryEvent) {
    if (event.name === 'first_overheat' && this.hasOverheatedThisRun) return
    if (event.name === 'first_overheat') this.hasOverheatedThisRun = true

    const fullEvent = { ...event, timestamp: Date.now() }
    this.events.push(fullEvent)
    
    // In a real game, this would batch send to an analytics endpoint.
    // For now, we output to console for M6 validation.
    console.debug(`[Telemetry] ${fullEvent.name}:`, fullEvent)
  }
  
  getRunTimeMs() {
    return Date.now() - this.sessionStartTime
  }
  
  getVariantId() {
    return this._variantId
  }

  getEvents() {
    return this.events
  }
}

export const telemetry = new TelemetryService()
