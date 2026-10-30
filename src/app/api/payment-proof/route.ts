import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { getRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

const MEDIA_BUCKET = "meems-gems-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: [0xff, 0xd8, 0xff] }],
  ["image/png", { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47] }],
  ["image/webp", { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] }],
]);

function hasValidImageSignature(
  content: Buffer,
  mimeType: string,
  extension: string
) {
  const fileType = allowedTypes.get(mimeType);
  if (!fileType || !fileType.signature.every((byte, index) => content[index] === byte)) {
    return false;
  }
  return extension !== "webp" || content.toString("ascii", 8, 12) === "WEBP";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a payment receipt image to upload." }, { status: 400 });
    }

    const fileType = allowedTypes.get(file.type);
    if (!fileType) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "The receipt image must be 5 MB or smaller." }, { status: 400 });
    }

    const content = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(content, file.type, fileType.extension)) {
      return NextResponse.json({ error: "The uploaded file is not a valid image." }, { status: 400 });
    }

    const supabase = isSupabaseConfigured() ? getSupabaseServer() : null;
    if (isSupabaseConfigured() && !supabase) {
      return NextResponse.json(
        { error: "Secure receipt storage is unavailable. Please try again or contact the store." },
        { status: 503 }
      );
    }
    if (!supabase && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Receipt uploads are unavailable until secure storage is configured." },
        { status: 503 }
      );
    }

    const fileName = `${randomUUID()}.${fileType.extension}`;
    const storagePath = `payment-proofs/${fileName}`;
    let url: string;

    if (supabase) {
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, content, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
      if (error) {
        throw new Error(`Unable to save payment receipt: ${error.message}`);
      }
      url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    } else {
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "payment-proofs");
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, fileName), content, { flag: "wx" });
      url = new URL(
        `/uploads/payment-proofs/${fileName}`,
        getRequestOrigin(request)
      ).toString();
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Payment receipt upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment receipt upload failed." },
      { status: 500 }
    );
  }
}
