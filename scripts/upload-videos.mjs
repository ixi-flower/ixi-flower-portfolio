import { v2 as cloudinary } from 'cloudinary'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve('/home/ixi_flower/ecode/.env')
const envContent = readFileSync(envPath, 'utf-8')
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
  process.env[key] = value
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const videos = [
  { path: '/home/ixi_flower/Ecode.new.mp4', publicId: 'ecode/ecode_new' },
  { path: '/home/ixi_flower/Ecode1_3 (1).mp4', publicId: 'ecode/ecode1_3' },
  { path: '/home/ixi_flower/Ecode_adjusted_final.mp4', publicId: 'ecode/ecode_adjusted_final' },
]

for (const video of videos) {
  console.log(`Uploading ${video.path}...`)
  try {
    const result = await cloudinary.uploader.upload(video.path, {
      public_id: video.publicId,
      resource_type: 'video',
      folder: '',
      chunk_size: 6000000,
      eager: [
        { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
      ],
      eager_async: true,
    })
    console.log(`✅ ${video.publicId}: ${result.secure_url}`)
  } catch (err) {
    console.error(`❌ ${video.publicId}: ${err.message}`)
  }
}
