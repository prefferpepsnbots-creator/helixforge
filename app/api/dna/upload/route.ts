import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * DNA File Upload API
 *
 * POST /api/dna/upload
 * Accepts a raw DNA file (multipart/form-data) and uploads it to
 * Supabase Storage under the user's private prefix.
 *
 * Returns a signed storage URL valid for 48 hours (GIPA/CCPA compliance:
 * no raw data stored >48h without explicit consent).
 *
 * Accepted formats: .txt (23andMe, AncestryDNA), .csv (FTDNA, Nebula),
 * .zip (MyHeritage, Nebula Genomics)
 */

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXTENSIONS = new Set([".txt", ".csv", ".zip"]);

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Validate file type ──────────────────────────────────────────────────────
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file format: ${ext}. Accepted: .txt, .csv, .zip` },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) && ext !== ".txt") {
    console.warn(`[dna/upload] Unexpected MIME type: ${file.type} for ${file.name}`);
  }

  // ── Validate file size ──────────────────────────────────────────────────────
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 100MB.` },
      { status: 400 }
    );
  }

  if (file.size < 1024) {
    return NextResponse.json(
      { error: "File appears empty or too small to be a valid DNA file." },
      { status: 400 }
    );
  }

  // ── Upload to Supabase Storage ──────────────────────────────────────────────
  const supabase = createServiceRoleClient();
  const bucket = "dna-files";

  // Ensure bucket exists (idempotent — safe to call every time)
  const { error: bucketError } = await supabase.storage.getBucket(bucket);
  if (bucketError) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: false,
    });
    if (createError && createError.message !== `Bucket '${bucket}' already exists`) {
      console.error("[dna/upload] Failed to ensure bucket:", createError);
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 });
    }
  }

  // Store file at: dna-files/{userId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${clerkUserId}/${timestamp}_${safeFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      // Auto-delete after 48 hours for GIPA/CCPA compliance
      // Note: Supabase free tier doesn't support auto-delete policies via SDK,
      // so we set a cleanup cron job in Supabase dashboard instead
      // (or use Supabase Edge Functions for TTL enforcement)
      upsert: false,
    });

  if (uploadError) {
    console.error("[dna/upload] Supabase upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  // Generate a signed URL valid for 48 hours
  const { data: signedUrlData, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 48 * 60 * 60); // 48 hours in seconds

  if (signError || !signedUrlData) {
    console.error("[dna/upload] Failed to generate signed URL:", signError);
    return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 });
  }

  console.log(
    `[dna/upload] Uploaded ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) ` +
      `for user ${clerkUserId}: ${storagePath}`
  );

  return NextResponse.json({
    success: true,
    fileUrl: signedUrlData.signedUrl,
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  });
}
