import type { App } from 'vue'

export interface PerfMonitorOptions {
  enabled?: boolean // 是否启用，默认 true
  threshold?: number // 超过多少 ms 输出日志，默认 16.6
}

const DEFAULT_THRESHOLD = 16.6

export default {
  install(app: App, options: PerfMonitorOptions = {}) {
    const threshold = options.threshold ?? DEFAULT_THRESHOLD
    const enabled = options.enabled ?? true
    if (!enabled) return

    function logWarning(type: string, cost: number, threshold: number, stack?: string) {
      console.warn(`%c[${type} Warning] Callback took ${cost.toFixed(2)}ms (threshold ${threshold}ms)\n${stack ?? ''}`, 'color: red;')
    }
    function monitor(fn: () => void, type: string, threshold: number, stack?: string) {
      const start = performance.now()
      try {
        fn()
      } finally {
        const cost = performance.now() - start
        if (cost > threshold) logWarning(type, cost, threshold, stack)
      }
    }
    function wrapTimer<T extends (...args: any[]) => number>(
      originalFn: T,
      type: 'setTimeout' | 'setInterval' | 'requestIdleCallback'
    ): (...args: any[]) => number {
      return (cb: (...args: any[]) => void, delayOrOptions?: any, ...args: any[]): number => {
        if (typeof cb !== 'function') throw new TypeError(`${type} callback must be a function`)
        const stack = new Error().stack?.split('\n').slice(2).join('\n') ?? ''

        if (type === 'requestIdleCallback') {
          return (originalFn as any)((deadline: IdleDeadline) => monitor(() => cb(deadline), type, threshold, stack), delayOrOptions)
        }

        return originalFn(() => monitor(() => cb(...args), type, delayOrOptions || threshold, stack), delayOrOptions)
      }
    }
    const originalRaf = window.requestAnimationFrame.bind(window)
    const originalSetTimeout = window.setTimeout.bind(window) as unknown as (...args: any[]) => number
    const originalSetInterval = window.setInterval.bind(window) as unknown as (...args: any[]) => number
    const originalIdle = window.requestIdleCallback?.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback, thresholdOverride = threshold): number => {
      if (typeof cb !== 'function') throw new TypeError('requestAnimationFrame callback must be a function')
      const stack = new Error().stack?.split('\n').slice(2).join('\n') ?? ''
      return originalRaf((ts: number) => monitor(() => cb(ts), 'rAF', thresholdOverride, stack))
    }
    ;(window as any).setTimeout = wrapTimer(originalSetTimeout, 'setTimeout')
    ;(window as any).setInterval = wrapTimer(originalSetInterval, 'setInterval')
    if (originalIdle) (window as any).requestIdleCallback = wrapTimer(originalIdle, 'requestIdleCallback')
    console.log('%c[PerfMonitor] Vue plugin enabled (DEV only)', 'color: green;')
  }
}
