import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';

import { StoredImage } from './storage.types';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'properties',
  ): Promise<StoredImage> {
    const safeFolder = this.sanitizeFolder(folder);
    const safeName = this.sanitizeFileName(file.originalname);
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const key = `${safeFolder}/${year}/${month}/${randomUUID()}-${safeName}`;

    await this.signedRequest('PUT', key, file.buffer, file.mimetype);

    return {
      publicId: `r2:${key}`,
      imageUrl: this.publicUrl(key),
    };
  }

  async deleteImage(publicId: string): Promise<boolean> {
    const key = publicId.startsWith('r2:') ? publicId.slice(3) : publicId;

    if (!key) {
      return true;
    }

    await this.signedRequest('DELETE', key);
    return true;
  }

  private async signedRequest(
    method: 'PUT' | 'DELETE',
    key: string,
    body?: Buffer,
    contentType?: string,
  ): Promise<void> {
    const accountId = this.requiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.requiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requiredConfig('R2_SECRET_ACCESS_KEY');
    const bucketName = this.requiredConfig('R2_BUCKET_NAME');

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = new URL(
      `${endpoint}/${this.encodePath(bucketName)}/${this.encodePath(key)}`,
    );

    const payloadHash = this.sha256(body ?? Buffer.alloc(0));
    const timestamp = new Date()
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.slice(0, 8);

    const headers: Record<string, string> = {
      host: url.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': timestamp,
    };

    if (contentType) {
      headers['content-type'] = contentType;
    }

    const headerNames = Object.keys(headers).sort();
    const canonicalHeaders =
      headerNames.map((name) => `${name}:${headers[name].trim()}\n`).join('');
    const signedHeaders = headerNames.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const scope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      scope,
      this.sha256(canonicalRequest),
    ].join('\n');

    const dateKey = this.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const regionKey = this.hmac(dateKey, 'auto');
    const serviceKey = this.hmac(regionKey, 's3');
    const signingKey = this.hmac(serviceKey, 'aws4_request');
    const signature = this.hmac(signingKey, stringToSign).toString('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const requestHeaders: Record<string, string> = {
      Authorization: authorization,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': timestamp,
    };

    if (contentType) {
      requestHeaders['Content-Type'] = contentType;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method === 'PUT' ? body : undefined,
    });

    if (!response.ok) {
      this.logger.error(
        `R2 ${method} failed with HTTP ${response.status} for ${key}`,
      );
      throw new InternalServerErrorException(
        'Image storage operation failed.',
      );
    }
  }

  private publicUrl(key: string): string {
    const baseUrl = this.requiredConfig('R2_PUBLIC_BASE_URL').replace(
      /\/+$/,
      '',
    );

    return `${baseUrl}/${this.encodePath(key)}`;
  }

  private requiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();

    if (!value) {
      throw new InternalServerErrorException(
        `Missing required R2 configuration: ${name}`,
      );
    }

    return value;
  }

  private sanitizeFolder(folder: string): string {
    const value = folder
      .split('/')
      .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)
      .join('/');

    return value || 'uploads';
  }

  private sanitizeFileName(fileName: string): string {
    const value = fileName
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[.-]+/, '')
      .slice(-120);

    return value || 'image';
  }

  private encodePath(value: string): string {
    return value
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }

  private sha256(value: Buffer | string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hmac(key: Buffer | string, value: string): Buffer {
    return createHmac('sha256', key).update(value).digest();
  }
}
