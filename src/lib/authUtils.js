export const AUTH_USERS_KEY = 'trustbreak_auth_users'
export const LEGACY_AUTH_USERS_KEY = 'ghostnet_auth_users'

export function buildUserFromEmail(email, displayName) {
  const cleanEmail = (email || 'guest@trustbreak.ai').trim()
  const baseName = displayName || cleanEmail.split('@')[0] || 'TrustBreak User'
  const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    uid: `trustbreak-${baseName.toLowerCase().replace(/\s+/g, '-')}-${idSuffix}`,
    id: `trustbreak-${baseName.toLowerCase().replace(/\s+/g, '-')}-${idSuffix}`,
    email: cleanEmail,
    displayName: baseName,
    emailVerified: true,
    photoURL: '',
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: baseName,
      avatar_url: '',
    },
  }
}

export function validateCredentials(email, password) {
  const cleanEmail = String(email || '').trim()
  const cleanPassword = String(password || '').trim()

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.')
  }

  if (!cleanPassword || cleanPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long.')
  }

  return { email: cleanEmail, password: cleanPassword }
}

export function buildLocalAuthUser(email, password, displayName, createdAt = new Date().toISOString()) {
  const normalized = validateCredentials(email, password)
  const finalName = (displayName || normalized.email.split('@')[0] || 'TrustBreak User').trim()

  return {
    id: `local-user-${normalized.email.toLowerCase()}`,
    email: normalized.email.toLowerCase(),
    password: normalized.password,
    displayName: finalName,
    created_at: createdAt,
  }
}

export function readStoredAuthUsers() {
  try {
    const source = localStorage.getItem(AUTH_USERS_KEY) || localStorage.getItem(LEGACY_AUTH_USERS_KEY)
    if (!source) return {}
    const parsed = JSON.parse(source)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeStoredAuthUsers(users) {
  try {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users))
    localStorage.setItem(LEGACY_AUTH_USERS_KEY, JSON.stringify(users))
  } catch {}
}

export function signUpLocalUser(email, password, displayName) {
  const { email: cleanEmail, password: cleanPassword } = validateCredentials(email, password)
  const normalizedEmail = cleanEmail.toLowerCase()
  const storedUsers = readStoredAuthUsers()

  if (storedUsers[normalizedEmail]) {
    throw new Error('An account with this email already exists. Please sign in instead.')
  }

  const userRecord = buildLocalAuthUser(normalizedEmail, cleanPassword, displayName || normalizedEmail.split('@')[0])
  const nextUsers = { ...storedUsers, [normalizedEmail]: userRecord }
  writeStoredAuthUsers(nextUsers)

  return {
    userRecord,
    user: buildUserFromEmail(normalizedEmail, userRecord.displayName),
  }
}

export function signInLocalUser(email, password) {
  const { email: cleanEmail, password: cleanPassword } = validateCredentials(email, password)
  const normalizedEmail = cleanEmail.toLowerCase()
  const storedUsers = readStoredAuthUsers()
  const savedUser = storedUsers[normalizedEmail]

  if (!savedUser) {
    throw new Error('No account found for this email. Create one first or continue as guest.')
  }

  if (savedUser.password !== cleanPassword) {
    throw new Error('Incorrect password. Please try again.')
  }

  return {
    userRecord: savedUser,
    user: buildUserFromEmail(normalizedEmail, savedUser.displayName || normalizedEmail.split('@')[0]),
  }
}
