import { createHash, randomBytes } from 'crypto'

export function hashAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createRawToken() {
  return randomBytes(32).toString('hex')
}

export const authTokenId = {
  passwordReset: (email: string) => `password-reset:${email}`,
  emailVerify: (email: string) => `email-verify:${email}`,
  oneTimeLogin: (userId: string) => `one-time-login:${userId}`,
} as const

export function getAuthBaseUrl() {
  return process.env.AUTH_URL ?? 'http://localhost:3000'
}
