import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { cloudinaryService } from "@/services/storage/cloudinary.service";

export async function POST(request: Request) {
  try { await requirePermission("products.update"); const { folder } = z.object({ folder: z.enum(["products", "categories", "users", "business", "menu", "promotions", "receipts"]) }).parse(await readJson(request)); return ok(cloudinaryService.createUploadSignature(folder)); }
  catch (error) { return handleApiError(error); }
}
