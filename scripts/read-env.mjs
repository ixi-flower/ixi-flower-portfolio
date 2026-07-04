import { writeFileSync, readFileSync } from 'fs'
import { createHash } from 'crypto'

// We'll use curl with the Cloudinary API directly
// First, let's just read the env and print what we need for curl
import { readFileSync } from 'fs'

const envContent = readFileSync('/home/ixi_flower/ecode/.env', 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let value = trimmed.slice(eqIdx + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  env[key] = value
}

console.log(`CLOUD_NAME=${env.CLOUDINARY_CLOUD_NAME}`)
console.log(`API_KEY=${env.CLOUDINARY_API_KEY}`)
console.log(`API_SECRET=${env.CLOUDINARY_API_SECRET}`)
