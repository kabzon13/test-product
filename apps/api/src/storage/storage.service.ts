import { randomUUID } from 'node:crypto';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB, type Db } from '../db/db.module';
import { files } from '../db/schema';
import { env } from '../env';

const PRESIGN_TTL_SECONDS = 15 * 60;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;

  constructor(@Inject(DB) private readonly db: Db) {
    this.s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }

  async onModuleInit(): Promise<void> {
    // локально bucket в MinIO создаём сами; в проде он уже существует
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
        this.logger.log(`bucket ${env.S3_BUCKET} created`);
      } catch (err) {
        this.logger.warn({ err }, `bucket ${env.S3_BUCKET} is not accessible`);
      }
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Uint8Array> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    if (!res.Body) throw new NotFoundException();
    return res.Body.transformToByteArray();
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }

  async presignUpload(input: {
    userId: string;
    filename: string;
    contentType: string;
    size?: number | undefined;
  }): Promise<{ fileId: string; key: string; url: string }> {
    const key = `uploads/${input.userId}/${randomUUID()}/${input.filename}`;
    const inserted = await this.db
      .insert(files)
      .values({
        userId: input.userId,
        key,
        contentType: input.contentType,
        size: input.size ?? null,
      })
      .returning({ id: files.id });
    const file = inserted[0];
    if (!file) throw new Error('failed to create file record');
    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: input.contentType }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
    return { fileId: file.id, key, url };
  }

  async presignDownload(fileId: string): Promise<{ url: string }> {
    const found = await this.db
      .select({ key: files.key })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    const file = found[0];
    if (!file) throw new NotFoundException();
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: file.key }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
    return { url };
  }

  async markUploaded(fileId: string): Promise<void> {
    await this.db.update(files).set({ status: 'uploaded' }).where(eq(files.id, fileId));
  }
}
