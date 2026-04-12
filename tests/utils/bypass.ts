import { SignJWT } from 'jose'

/**
 * Generates a signed JWT bypass token for E2E tests.
 * This must match the verification logic in src/utils/test-bypass.ts
 */
export async function generateBypassToken() {
  const secret = process.env.TEST_BYPASS_SECRET || 'playwright-local-test-secret'
  console.log(`[Test Utility] Using secret starting with: ${secret.substring(0, 3)}`)
  const key = new TextEncoder().encode(secret)
  
  return await new SignJWT({ bypass: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key)
}

export const BYPASS_COOKIE_NAME = 'test-bypass-token'
