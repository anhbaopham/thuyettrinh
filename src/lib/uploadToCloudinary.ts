import { auth } from "../config/firebase";

interface SignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
  allowedFormats: string;
  maxFileSize: number;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: "image" | "video" | "raw";
  width?: number;
  height?: number;
  bytes: number;
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("Chưa đăng nhập");

  const token = await user.getIdToken();
  const signRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!signRes.ok) {
    const body = await signRes.json().catch(() => ({}));
    throw new Error(body.error || `Sign failed (${signRes.status})`);
  }

  const sign: SignResponse = await signRes.json();

  if (file.size > sign.maxFileSize) {
    throw new Error(
      `File quá lớn: ${(file.size / 1_000_000).toFixed(1)}MB > ${sign.maxFileSize / 1_000_000}MB`,
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sign.apiKey);
  formData.append("timestamp", String(sign.timestamp));
  formData.append("signature", sign.signature);
  formData.append("folder", sign.folder);

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          publicId: data.public_id,
          url: data.url,
          secureUrl: data.secure_url,
          format: data.format,
          resourceType: data.resource_type,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
