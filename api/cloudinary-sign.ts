import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v2 as cloudinary } from "cloudinary";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const idToken = authHeader.slice("Bearer ".length).trim();

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `thuyettrinh/${decoded.uid}`;

    const paramsToSign = {
      timestamp,
      folder,
      allowed_formats: "jpg,png,webp,gif,mp4,webm",
      max_file_size: 10_000_000,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return res.status(200).json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      allowedFormats: paramsToSign.allowed_formats,
      maxFileSize: paramsToSign.max_file_size,
    });
  } catch (error) {
    console.error("Sign error:", error);
    return res.status(500).json({ error: "Failed to sign upload" });
  }
}
