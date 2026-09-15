import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadImage(buffer: Buffer, folder = "ixi-wave/covers", timeout = 120_000): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Cloudinary upload timed out")), timeout);
    const stream = cloudinary.uploader.upload_stream({ folder, timeout }, (err, res) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve({ url: res!.secure_url as string, publicId: res!.public_id as string });
    });
    stream.end(buffer);
  });
}

export async function uploadAudio(buffer: Buffer, fileName: string, folder = "ixi-wave/tracks", timeout = 180_000): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Cloudinary upload timed out")), timeout);
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "video", public_id: fileName.replace(/\.[^.]+$/, "").slice(0, 80), timeout }, (err, res) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve({ url: res!.secure_url as string, publicId: res!.public_id as string });
    });
    stream.end(buffer);
  });
}
