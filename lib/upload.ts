export function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    // Owner header — read from localStorage so /admin pages can authenticate without Stack
    try {
      const secret = typeof window !== "undefined" ? localStorage.getItem("ixi_admin_secret") : null;
      if (secret) xhr.setRequestHeader("x-admin-secret", secret);
      else xhr.setRequestHeader("x-admin-email", "amirabbas.rouintan2007@gmail.com");
    } catch {}
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data.url as string);
        else reject(new Error(data.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}
