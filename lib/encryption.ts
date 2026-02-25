import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is not set")
  const buf = Buffer.from(key, "hex")
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  return buf
}

// Returns "ivHex:authTagHex:encryptedHex"
export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":")
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted text format")
  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
