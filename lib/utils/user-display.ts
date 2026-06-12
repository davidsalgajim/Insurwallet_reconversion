import type { User } from 'firebase/auth'

export function getUserDisplayInitials(user: User | null): string {
  if (!user) {
    return '?'
  }

  const displayName = user.displayName?.trim()

  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean)

    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
    }

    return displayName.slice(0, 2).toUpperCase()
  }

  const email = user.email?.trim()

  if (email) {
    return email.slice(0, 2).toUpperCase()
  }

  return '?'
}
