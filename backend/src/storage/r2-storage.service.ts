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
    const key = this.buildKey(file, folder);

    await this.signedRequest('PUT', key, file.buffer, file.mimetype, this.requiredConfig('R2_BUCKET_NAME'));

    return {
      publicId: `r2:${key}`,
      imageUrl: this.publicUrl(key),
    };
  }

  async uploadPrivateFile(
    file: Express.Multer.File,
    folder = 'chat-attachments',
  ): Promise<{ publicId: string }> {
    const key = this.buildKey(file, folder);

    await this.signedRequest('PUT', key, file.buffer, file.mimetype, this.requiredConfig('R2_PRIVATE_BUCKET_NAME'));

    return {
      publicId: `r2p:${key}`,
    };
  }

  async getSignedUrl(publicId: string, expiresInSeconds = 900): Promise<string> {
    const isPrivate = publicId.startsWith('r2p:');
    const key = isPrivate ? publicId.slice(4) : publicId.startsWith('r2:') ? publicId.slice(3) : publicId;
    if (!key) throw new InternalServerErrorException('Invalid storage object.');

    const accountId = this.requiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.requiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requiredConfig('R2_SECRET_ACCESS_KEY');
    const bucketName = isPrivate
      ? this.requiredConfig('R2_PRIVATE_BUCKET_NAME')
      : this.requiredConfig('R2_BUCKET_NAME');
    const expires = Math.min(Math.max(Math.floor(expiresInSeconds), 60), 3600);
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = new URL(`${endpoint}/${this.encodePath(targetBucket)}/${this.encodePath(key)}`);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.slice(0, 8);
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const credential = `${accessKeyId}/${credentialScope}`;
    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': timestamp,
      'X-Amz-Expires': String(expires),
      'X-Amz-SignedHeaders': 'host',
    });
    const canonicalQuery = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const canonicalRequest = [
      'GET',
      url.pathname,
      canonicalQuery,
      `host:${url.host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      credentialScope,
      this.sha256(canonicalRequest),
    ].join('\n');

    const dateKey = this.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const regionKey = this.hmac(dateKey, 'auto');
    const serviceKey = this.hmac(regionKey, 's3');
    const signingKey = this.hmac(serviceKey, 'aws4_request');
    const signature = this.hmac(signingKey, stringToSign).toString('hex');

    params.set('X-Amz-Signature', signature);
    return `${url.origin}${url.pathname}?${params.toString()}`;
  }

  async listObjects(): Promise<Array<{ publicId: string; createdAt: Date }>> {
    const objects: Array<{ publicId: string; createdAt: Date }> = [];
    for (const prefix of ['properties/', 'property-videos/']) {
      let continuationToken: string | undefined;
      do {
        const page = await this.listObjectsPage(prefix, continuationToken, this.requiredConfig('R2_BUCKET_NAME'));
        for (const object of page.objects) {
          if (!object.key || !object.lastModified) continue;
          objects.push({
            publicId: `r2:${object.key}`,
            createdAt: new Date(object.lastModified),
          });
        }
        continuationToken = page.nextToken;
      } while (continuationToken);
    }
    for (const prefix of ['chat-attachments/']) {
      let continuationToken: string | undefined;
      do {
        const page = await this.listObjectsPage(prefix, continuationToken, this.requiredConfig('R2_PRIVATE_BUCKET_NAME'));
        for (const object of page.objects) {
          if (!object.key || !object.lastModified) continue;
          objects.push({ publicId: `r2p:${object.key}`, createdAt: new Date(object.lastModified) });
        }
        continuationToken = page.nextToken;
      } while (continuationToken);
    }
    return objects;
  }

  async deleteImage(publicId: string): Promise<boolean> {
    const isPrivate = publicId.startsWith('r2p:');
    const key = isPrivate ? publicId.slice(4) : publicId.startsWith('r2:') ? publicId.slice(3) : publicId;

    if (!key) {
      return true;
    }

    await this.signedRequest('DELETE', key, undefined, undefined, isPrivate ? this.requiredConfig('R2_PRIVATE_BUCKET_NAME') : this.requiredConfig('R2_BUCKET_NAME'));
    return true;
  }

  private async listObjectsPage(prefix: string, continuationToken?: string, bucketName?: string): Promise<{
    objects: Array<{ key: string; lastModified: string }>;
    nextToken?: string;
  }> {
    const accountId = this.requiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.requiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requiredConfig('R2_SECRET_ACCESS_KEY');
    const targetBucket = bucketName ?? this.requiredConfig('R2_BUCKET_NAME');
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = new URL(`${endpoint}/${this.encodePath(targetBucket)}`);
    const params = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000', prefix });
    if (continuationToken) params.set('continuation-token', continuationToken);
    url.search = params.toString();

    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.slice(0, 8);
    const scope = `${dateStamp}/auto/s3/aws4_request`;
    const canonicalQuery = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const canonicalRequest = [
      'GET',
      url.pathname,
      canonicalQuery,
      `host:${url.host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');
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
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=host, Signature=${signature}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': timestamp,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException('R2 object listing failed.');
    }

    const xml = await response.text();
    const objects = Array.from(xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g))
      .map((match) => {
        const key = this.decodeXml(match[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1] ?? '');
        const lastModified = this.decodeXml(
          match[1].match(/<LastModified>([\s\S]*?)<\/LastModified>/)?.[1] ?? '',
        );
        return { key, lastModified };
      })
      .filter((object) => object.key && object.lastModified);

    const nextToken = this.decodeXml(
      xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] ?? '',
    );

    return { objects, nextToken: nextToken || undefined };
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private buildKey(file: Express.Multer.File, folder: string): string {
    const safeFolder = this.sanitizeFolder(folder);
    const safeName = this.sanitizeFileName(file.originalname);
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `${safeFolder}/${year}/${month}/${randomUUID()}-${safeName}`;
  }

  private async signedRequest(
    method: 'PUT' | 'DELETE',
    key: string,
    body?: Buffer,
    contentType?: string,
    bucketName?: string,
  ): Promise<void> {
    const accountId = this.requiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.requiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requiredConfig('R2_SECRET_ACCESS_KEY');
    const targetBucket = bucketName ?? this.requiredConfig('R2_BUCKET_NAME');

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
