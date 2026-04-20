import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32  // bytes
const IV_LENGTH  = 12  // bytes (GCM standard)
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypta PII (nome, email) at-rest.
 * Retorna Buffer com estrutura: [IV (12 bytes) | AuthTag (16 bytes) | Ciphertext]
 */
export function encryptPii(plaintext: string): Buffer {
  const key = getKey()
  const iv  = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted])
}

/**
 * Decripta PII armazenado como Buffer (lido do Supabase como BYTEA).
 */
export function decryptPii(data: Buffer): string {
  const key     = getKey()
  const iv      = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return decipher.update(ciphertext) + decipher.final('utf8')
}

/**
 * Hash de phone para deduplicação sem armazenar PII.
 * SHA-256: não reversível, usado apenas para identificar duplicatas.
 */
export function hashPhone(phone: string): string {
  return createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex')
}

/**
 * Hash de WhatsApp number para atribuição sem armazenar PII.
 */
export function hashWhatsapp(number: string): string {
  return createHash('sha256').update(number.replace(/\D/g, '')).digest('hex')
}
