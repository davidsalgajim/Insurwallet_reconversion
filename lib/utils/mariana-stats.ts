const STORAGE_PREFIX = 'insurwallet-mariana-query-count'

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`
}

export function getMarianaQueryCount(uid: string): number {
  if (typeof window === 'undefined') {
    return 0
  }

  const raw = window.localStorage.getItem(storageKey(uid))
  const parsed = Number(raw)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function incrementMarianaQueryCount(uid: string): number {
  const next = getMarianaQueryCount(uid) + 1

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey(uid), String(next))
  }

  return next
}
