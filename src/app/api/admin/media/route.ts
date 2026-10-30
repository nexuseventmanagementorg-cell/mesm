import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const MEDIA_BUCKET = "meems-gems-media";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_REQUEST_SIZE = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const allowedMediaTypes: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: Request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const entries = formData.getAll("files");
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Choose one or more image or video files to upload." },
        { status: 400 }
      );
    }
    if (entries.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_FILE_COUNT} files at a time.` },
        { status: 400 }
      );
    }

    const mediaFiles: File[] = [];
    for (const entry of entries) {
      if (!(entry instanceof File)) {
        return NextResponse.json(
          { error: "Choose one or more image or video files to upload." },
          { status: 400 }
        );
      }
      mediaFiles.push(entry);
    }
    let totalSize = 0;
    for (const file of mediaFiles) {
      const extension = allowedMediaTypes[file.type];
      if (!extension) {
        return NextResponse.json(
          { error: "Use JPG, PNG, WebP, AVIF, GIF, MP4, or WebM files." },
          { status: 400 }
        );
      }

      const maxSize = file.type.startsWith("image/")
        ? MAX_IMAGE_SIZE
        : MAX_VIDEO_SIZE;
      if (file.size === 0 || file.size > maxSize) {
        return NextResponse.json(
          {
            error: file.type.startsWith("image/")
              ? "Each image must be 10 MB or smaller."
              : "Each video must be 50 MB or smaller.",
          },
          { status: 400 }
        );
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "The combined upload size must be 50 MB or smaller." },
        { status: 400 }
      );
    }

    if (
      isSupabaseConfigured() &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        { error: "Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY to enable secure media uploads." },
        { status: 503 }
      );
    }
    const supabase = isSupabaseConfigured() ? getSupabaseServer() : null;
    if (!supabase && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Configure Supabase Storage before uploading media in production." },
        { status: 503 }
      );
    }

    const urls: string[] = [];
    for (const file of mediaFiles) {
      const extension = allowedMediaTypes[file.type];
      const fileName = `${randomUUID()}.${extension}`;
      const filePath = `${file.type.startsWith("image/") ? "images" : "videos"}/${fileName}`;
      const contents = Buffer.from(await file.arrayBuffer());

      if (supabase) {
        const { error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(filePath, contents, {
            cacheControl: "31536000",
            contentType: file.type,
            upsert: false,
          });
        if (error) {
          throw new Error(`Unable to upload media to Supabase Storage: ${error.message}`);
        }
        urls.push(
          supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath).data.publicUrl
        );
      } else {
        const uploadDirectory = path.join(process.cwd(), "public", "uploads", path.dirname(filePath));
        await mkdir(uploadDirectory, { recursive: true });
        await writeFile(path.join(uploadDirectory, fileName), contents, { flag: "wx" });
        urls.push(`/uploads/${filePath}`);
      }
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Admin media upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Media upload failed unexpectedly.",
      },
      { status: 500 }
    );
  }
}
