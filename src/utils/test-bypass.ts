import { SignJWT, jwtVerify } from 'jose'

const SECRET = process.env.TEST_BYPASS_SECRET || 'playwright-local-test-secret'
const key = new TextEncoder().encode(SECRET)

const COOKIE_NAME = 'test-bypass-token'
const COOKIE_ACTIVE_NAME = 'test-bypass-active'

export async function signBypassToken() {
  const secret = process.env.TEST_BYPASS_SECRET || 'playwright-local-test-secret'
  const key = new TextEncoder().encode(secret)
  
  return await new SignJWT({ bypass: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // Reverted to 5m as requested
    .sign(key)
}

export async function verifyBypassToken(token: string | undefined) {
  if (!token) return false
  
  const secret = process.env.TEST_BYPASS_SECRET || 'playwright-local-test-secret'
  const key = new TextEncoder().encode(secret)
  
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload.bypass === true
  } catch (err) {
    return false
  }
}

export const BYPASS_COOKIES = {
  TOKEN: COOKIE_NAME,
  ACTIVE: COOKIE_ACTIVE_NAME,
}
