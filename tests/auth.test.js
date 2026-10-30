import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  validateCredentials,
  signUpLocalUser,
  signInLocalUser,
} from '../src/lib/authUtils.js'

function createStorage() {
  const store = new Map()

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    removeItem(key) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }
}

describe('Local auth workflow', () => {
  beforeEach(() => {
    const local = createStorage()
    const session = createStorage()

    Object.defineProperty(globalThis, 'localStorage', {
      value: local,
      configurable: true,
      writable: true,
    })

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: session,
      configurable: true,
      writable: true,
    })
  })

  it('should validate email and password inputs', () => {
    assert.throws(() => validateCredentials('bad-email', '1234'), /valid email/i)
    assert.throws(() => validateCredentials('test@example.com', '123'), /at least 4 characters/i)

    const valid = validateCredentials('user@trustbreak.ai', 'secure123')
    assert.strictEqual(valid.email, 'user@trustbreak.ai')
    assert.strictEqual(valid.password, 'secure123')
  })

  it('should create a local account and sign in with the same email and password', () => {
    const created = signUpLocalUser('operator@trustbreak.ai', 'StrongPass123', 'Operator')
    assert.strictEqual(created.user.email, 'operator@trustbreak.ai')
    assert.strictEqual(created.user.displayName, 'Operator')

    const signedIn = signInLocalUser('operator@trustbreak.ai', 'StrongPass123')
    assert.strictEqual(signedIn.user.email, 'operator@trustbreak.ai')
    assert.strictEqual(signedIn.user.displayName, 'Operator')
  })
})
