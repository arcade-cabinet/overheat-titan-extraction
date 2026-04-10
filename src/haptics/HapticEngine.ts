import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

function canVibrate() {
  return Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && navigator.vibrate)
}

export const hapticManager = {
  // Overheat lockout — Heavy pulse (3 × 200ms pattern)
  async playOverheat() {
    if (!canVibrate()) return
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Heavy })
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200)
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 400)
    } else {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  },

  // Cube ejected — Medium pop
  async playCubeEject() {
    if (!canVibrate()) return
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } else {
      navigator.vibrate(80)
    }
  },

  // Cube sold in silo — Triple tick
  async playCubeSell() {
    if (!canVibrate()) return
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light })
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 50)
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 100)
    } else {
      navigator.vibrate([30, 20, 30, 20, 30])
    }
  },

  // Meltdown — Continuous heavy rumble
  async playMeltdown() {
    if (!canVibrate()) return
    if (Capacitor.isNativePlatform()) {
      await Haptics.vibrate({ duration: 1500 }) // Capacitor vibrate is basic on iOS, but good for meltdown
    } else {
      navigator.vibrate([200, 50, 200, 50, 200, 50, 300])
    }
  },
}
