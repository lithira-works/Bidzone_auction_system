import type { UserProfile } from '../types/userProfile'

const USERS_KEY = 'bidzone-users'
const SESSION_KEY = 'bidzone-session-user-id'
/** Legacy single flag from older builds — cleared when migrating */
const LEGACY_AUTH_KEY = 'bidzone-auth'

function loadUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x) => x && typeof (x as UserProfile).id === 'string') as UserProfile[]
  } catch {
    return []
  }
}

function saveUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* ignore */
  }
}

export function getSessionUserId(): string | null {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    return id && id.length > 0 ? id : null
  } catch {
    return null
  }
}

export function setSessionUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function findUserByEmail(email: string): UserProfile | undefined {
  const e = email.trim().toLowerCase()
  return loadUsers().find((u) => u.email === e)
}

export function findUserById(id: string): UserProfile | undefined {
  return loadUsers().find((u) => u.id === id)
}

export function addUser(user: UserProfile): 'ok' | 'email_taken' {
  const users = loadUsers()
  if (users.some((u) => u.email === user.email)) return 'email_taken'
  saveUsers([user, ...users])
  return 'ok'
}

export function updateUser(updated: UserProfile): void {
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === updated.id)
  if (idx === -1) return
  users[idx] = updated
  saveUsers(users)
}

/** Remove legacy auth flag; callers should re-login if no session user */
export function clearLegacyAuthFlag() {
  try {
    localStorage.removeItem(LEGACY_AUTH_KEY)
  } catch {
    /* ignore */
  }
}

export function hasLegacyAuthOnly(): boolean {
  try {
    return localStorage.getItem(LEGACY_AUTH_KEY) === '1'
  } catch {
    return false
  }
}
