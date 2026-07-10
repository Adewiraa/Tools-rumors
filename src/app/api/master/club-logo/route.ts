import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getMissingSupabaseAdminEnvVars,
} from "@/lib/supabase-server";

const bucketName = "club-logos";
const maxFileSize = 2 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "svg";
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const missingEnvVars = getMissingSupabaseAdminEnvVars();

    return NextResponse.json(
      {
        error: `Environment Supabase admin belum lengkap: ${missingEnvVars.join(
          ", ",
        )}. Tambahkan variable tersebut di Vercel lalu redeploy.`,
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const clubSlug = toSlug(String(formData.get("clubSlug") ?? "club"));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File logo wajib diupload." },
      { status: 400 },
    );
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Format logo harus PNG, JPG, WEBP, atau SVG." },
      { status: 400 },
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "Ukuran logo maksimal 2 MB." },
      { status: 400 },
    );
  }

  const { error: bucketLookupError } =
    await supabase.storage.getBucket(bucketName);

  if (bucketLookupError) {
    const { error: createBucketError } = await supabase.storage.createBucket(
      bucketName,
      {
        public: true,
      },
    );

    if (createBucketError) {
      return NextResponse.json(
        { error: `Gagal menyiapkan bucket logo: ${createBucketError.message}` },
        { status: 500 },
      );
    }
  }

  const extension = getExtension(file);
  const storagePath = `${clubSlug || "club"}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Gagal upload logo: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

  return NextResponse.json({
    bucket: bucketName,
    storagePath,
    publicUrl: data.publicUrl,
  });
}
