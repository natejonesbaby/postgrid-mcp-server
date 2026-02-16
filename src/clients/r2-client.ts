import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes — PostGrid fetches immediately

class R2Client {
  #client: S3Client | null = null;
  #bucket: string | null = null;

  private getClient(): S3Client {
    if (this.#client) return this.#client;

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucket = process.env.R2_BUCKET;

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
      throw new Error(
        "R2 credentials not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET environment variables."
      );
    }

    this.#bucket = bucket;
    this.#client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Scrub from process.env to prevent leakage
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    return this.#client;
  }

  private getBucket(): string {
    if (!this.#bucket) {
      this.getClient();
    }
    if (!this.#bucket) {
      throw new Error("R2 bucket not configured");
    }
    return this.#bucket;
  }

  /**
   * Generate presigned PUT and GET URLs for direct-to-R2 upload.
   * The caller uploads the file directly to R2 using the PUT URL,
   * then uses the GET URL as the `uploadedPDF` parameter in PostGrid.
   */
  async generatePresignedPutUrl(): Promise<{
    key: string;
    putUrl: string;
    getUrl: string;
  }> {
    const client = this.getClient();
    const bucket = this.getBucket();
    const key = `pdfs/${randomUUID()}.pdf`;

    // Only sign ContentType — CacheControl and ContentDisposition are omitted
    // because they become signed headers that the caller must reproduce exactly,
    // which causes SignatureDoesNotMatch errors with curl uploads.
    const putUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "application/pdf",
      }),
      { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
    );

    const getUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
    );

    return { key, putUrl, getUrl };
  }

  /**
   * Upload a PDF buffer to R2 and return a presigned GET URL.
   */
  async uploadPdf(data: Buffer): Promise<{ key: string; url: string }> {
    const client = this.getClient();
    const bucket = this.getBucket();
    const key = `pdfs/${randomUUID()}.pdf`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: "application/pdf",
        CacheControl: "no-store, max-age=0",
        ContentDisposition: 'inline; filename="document.pdf"',
      })
    );

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
    );

    return { key, url };
  }
}

export const r2Client = new R2Client();
