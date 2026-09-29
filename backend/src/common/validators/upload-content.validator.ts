import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-m4v']);
const AUDIO_TYPES = new Set([
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/aacp',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
]);

const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const EXTENSION_TYPE_MAP: Record<string, Set<string>> = {
  '.jpg': new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
  '.png': new Set(['image/png']),
  '.webp': new Set(['image/webp']),
  '.pdf': new Set(['application/pdf']),
  '.doc': new Set(['application/msword']),
  '.docx': new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
  ]),
  '.m4a': new Set(['audio/mp4', 'audio/x-m4a']),
  '.aac': new Set(['audio/aac', 'audio/aacp']),
  '.mp3': new Set(['audio/mpeg']),
  '.wav': new Set(['audio/wav', 'audio/x-wav']),
  '.ogg': new Set(['audio/ogg']),
};

export async function validateImageContent(
  file: Express.Multer.File,
): Promise<void> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('No image content uploaded.');
  }

  const extension = extensionOf(file.originalname);
  const detected = await detectFileType(file.buffer);

  if (!detected || !IMAGE_TYPES.has(detected.mime)) {
    throw new BadRequestException(
      'The uploaded image content is not a supported JPEG, PNG or WEBP image.',
    );
  }

  if (!EXTENSION_TYPE_MAP[extension]?.has(detected.mime)) {
    throw new BadRequestException(
      'The image extension does not match the detected file content.',
    );
  }

  try {
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.format || !metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata.');
    }
  } catch {
    throw new BadRequestException('The uploaded image is not a valid image file.');
  }
}

export async function validateVideoContent(
  file: Express.Multer.File,
): Promise<'video/mp4' | 'video/quicktime' | 'video/x-m4v'> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('No video content uploaded.');
  }

  const detected = await detectFileType(file.buffer);
  if (!detected || !VIDEO_TYPES.has(detected.mime)) {
    throw new BadRequestException(
      'The uploaded video content is not a supported MP4, MOV or M4V video.',
    );
  }

  return detected.mime as 'video/mp4' | 'video/quicktime' | 'video/x-m4v';
}

export async function validateChatFileContent(
  file: Express.Multer.File,
): Promise<void> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('No file content uploaded.');
  }

  const extension = extensionOf(file.originalname);

  if (extension === '.txt') {
    if (file.buffer.includes(0)) {
      throw new BadRequestException('The uploaded text file contains binary content.');
    }
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
    } catch {
      throw new BadRequestException('The uploaded text file is not valid UTF-8.');
    }
    return;
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !EXTENSION_TYPE_MAP[extension]?.has(detected.mime)) {
    throw new BadRequestException(
      'The uploaded file content does not match its allowed file type.',
    );
  }

  if (
    (extension === '.pdf' && !DOCUMENT_TYPES.has(detected.mime)) ||
    (extension === '.doc' && (detected.mime as string) !== 'application/msword') ||
    (extension === '.docx' &&
      detected.mime !== 'application/zip' &&
      detected.mime !==
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    (extension !== '.pdf' &&
      extension !== '.doc' &&
      extension !== '.docx' &&
      !AUDIO_TYPES.has(detected.mime))
  ) {
    throw new BadRequestException(
      'The uploaded file content is not an allowed document or audio file.',
    );
  }
}

async function detectFileType(buffer: Buffer) {
  const { fileTypeFromBuffer } = await import('file-type');
  return fileTypeFromBuffer(buffer);
}

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name || '');
  return match ? '.' + match[1].toLowerCase() : '';
}
