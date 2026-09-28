import { createHash } from "node:crypto";
import { InfrastructureError } from "@/lib/errors";

export class CloudinaryService {
  createUploadSignature(folder: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !secret) throw new InfrastructureError("El almacenamiento de imágenes aún no está configurado.");
    const timestamp = Math.floor(Date.now() / 1000);
    const safeFolder = `restaurant/${folder.replace(/[^a-z0-9/_-]/gi, "")}`;
    const signature = createHash("sha1").update(`folder=${safeFolder}&timestamp=${timestamp}${secret}`).digest("hex");
    return { cloudName, apiKey, timestamp, folder: safeFolder, signature };
  }

  optimizedUrl(url: string, width: number) {
    if (!url.includes("/upload/")) return url;
    return url.replace("/upload/", `/upload/f_auto,q_auto,c_fill,w_${width},h_${width}/`);
  }

  async destroy(publicId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !secret) return { deleted: false, reason: "not_configured" } as const;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
    const body = new FormData(); body.append("public_id", publicId); body.append("timestamp", String(timestamp)); body.append("api_key", apiKey); body.append("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body });
    if (!response.ok) throw new InfrastructureError("La imagen anterior no pudo eliminarse del almacenamiento.");
    return { deleted: true } as const;
  }
}

export const cloudinaryService = new CloudinaryService();
