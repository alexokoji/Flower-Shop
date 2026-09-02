import { GridFSBucket, ObjectId } from "mongodb";
import { db } from "@/lib/db/mongo";
import { HttpError } from "@/lib/api/guard";

/**
 * File storage.
 *
 * PocketBase kept uploads on its own disk and served them from /api/files/…
 * MongoDB's GridFS replaces that, which keeps the whole system in one managed
 * service — no S3 bucket or disk to provision, and nothing to lose when a
 * serverless instance is recycled.
 *
 * GridFS suits the sizes here (payment receipts, a few MB at most). Large media
 * would be better on object storage with a CDN in front.
 */

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

export interface StoredFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

async function bucket(): Promise<GridFSBucket> {
  return new GridFSBucket(await db(), { bucketName: "uploads" });
}

/**
 * Persist an uploaded file. `owner` and `collection` are recorded so the
 * download route can authorise a request without re-reading the parent row.
 */
export async function storeFile(
  file: File,
  meta: { owner: string; collection: string; field: string }
): Promise<StoredFile> {
  if (file.size > MAX_BYTES) {
    throw new HttpError(400, "That file is larger than the 5MB limit.");
  }
  if (!ALLOWED.has(file.type)) {
    throw new HttpError(400, "Upload a PNG, JPEG, WebP or PDF.");
  }

  // Never trust the client's filename in a path context.
  const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(-120) || "upload";

  const gfs = await bucket();
  // The driver stores contentType inside metadata for this API version.
  const stream = gfs.openUploadStream(safeName, {
    metadata: { ...meta, contentType: file.type, uploaded_at: new Date() },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await new Promise<void>((resolve, reject) => {
    stream.once("error", reject);
    stream.once("finish", () => resolve());
    stream.end(buffer);
  });

  return {
    id: String(stream.id),
    filename: safeName,
    contentType: file.type,
    size: file.size,
  };
}

export interface FetchedFile {
  buffer: Buffer;
  contentType: string;
  filename: string;
  owner: string;
}

/** Read a stored file, or null when the id is unknown. */
export async function readFile(id: string): Promise<FetchedFile | null> {
  if (!ObjectId.isValid(id)) return null;
  const _id = new ObjectId(id);

  const database = await db();
  const record = await database.collection("uploads.files").findOne({ _id });
  if (!record) return null;

  const gfs = await bucket();
  const chunks: Buffer[] = [];
  for await (const chunk of gfs.openDownloadStream(_id)) {
    chunks.push(chunk as Buffer);
  }

  const meta = (record.metadata ?? {}) as Record<string, unknown>;
  return {
    buffer: Buffer.concat(chunks),
    contentType: String(meta.contentType ?? record.contentType ?? "application/octet-stream"),
    filename: String(record.filename ?? "file"),
    owner: String(meta.owner ?? ""),
  };
}

export async function deleteFile(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const gfs = await bucket();
  try {
    await gfs.delete(new ObjectId(id));
  } catch {
    /* already gone */
  }
}
