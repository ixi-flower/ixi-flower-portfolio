import "server-only";
import crypto from "node:crypto";

function getKey(): Buffer {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET || "dev-secret-change-me";
  // Derive 32-byte key via SHA-256 (deterministic, strong enough for this vault)
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptVaultPassword(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptVaultPassword(ciphertextB64: string, ivB64: string, tagB64: string): string {
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(ciphertextB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function decryptRow(row: { encCiphertext: string; encIv: string; encTag: string }): string {
  return decryptVaultPassword(row.encCiphertext, row.encIv, row.encTag);
}
