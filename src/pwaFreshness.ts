declare const __GROWT_BUILD_ID__: string

const VERSION_ENDPOINT = '/app-version.json'
const RELOAD_GUARD_KEY = 'growt-reloaded-build'
const CHECK_INTERVAL_MS = 15 * 60 * 1000

type AppVersion = {
  buildId?: string
}

async function fetchLatestBuildId() {
  const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Unable to check GrowT version (${response.status})`)
  }

  const version = (await response.json()) as AppVersion
  return version.buildId
}

export function startAppFreshnessChecks() {
  if (!import.meta.env.PROD) return

  let checkInProgress = false

  const checkForFreshBuild = async () => {
    if (checkInProgress) return
    checkInProgress = true

    try {
      const latestBuildId = await fetchLatestBuildId()

      if (!latestBuildId || latestBuildId === __GROWT_BUILD_ID__) {
        sessionStorage.removeItem(RELOAD_GUARD_KEY)
        return
      }

      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === latestBuildId) return

      sessionStorage.setItem(RELOAD_GUARD_KEY, latestBuildId)
      window.location.reload()
    } catch {
      // Stay usable while offline or during a transient deployment switch.
    } finally {
      checkInProgress = false
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void checkForFreshBuild()
    }
  }

  void checkForFreshBuild()
  const intervalId = window.setInterval(() => void checkForFreshBuild(), CHECK_INTERVAL_MS)

  window.addEventListener('focus', checkForFreshBuild)
  window.addEventListener('online', checkForFreshBuild)
  window.addEventListener('pageshow', checkForFreshBuild)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.clearInterval(intervalId)
    window.removeEventListener('focus', checkForFreshBuild)
    window.removeEventListener('online', checkForFreshBuild)
    window.removeEventListener('pageshow', checkForFreshBuild)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
