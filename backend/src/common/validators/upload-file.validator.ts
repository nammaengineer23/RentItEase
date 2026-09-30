import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 10000;
const MAX_IMAGE_HEIGHT = 10000;
const MAX_IMAGE_PIXELS = 40_000_000;

const IMAGE_TYPES = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
]);

const CHAT_BINARY_TYPES = new Map([
  ['pdf', 'application/pdf'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['m4a', 'audio/mp4'],
  ['aac', 'audio/aac'],
  ['mp3', 'audio/mpeg'],
  ['wav', 'audio/wav'],
  ['ogg', 'audio/ogg'],
]);

function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export async function validateImageUpload(
  file: Express.Multer.File,
): Promise<void> {
  if (!file) throw new BadRequestException('No image uploaded.');
  if (file.size > MAX_IMAGE_SIZE) {
    throw new BadRequestException('Image must not exceed 5 MB.');
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  const declaredExtension = extensionOf(file.originalname);
  const expectedMime = IMAGE_TYPES.get(declaredExtension);

  if (!detected || !expectedMime || detected.mime !== expectedMime) {
    throw new BadRequestException(
      'Invalid image content. The file extension, MIME type and actual file format must match.',
    );
  }

  if (file.mimetype !== detected.mime) {
    throw new BadRequestException(
      'Invalid image MIME type.',
    );
  }

  try {
    const metadata = await sharp(file.buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata();

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_WIDTH ||
      metadata.height > MAX_IMAGE_HEIGHT ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new BadRequestException(
        'Image dimensions are too large or invalid.',
      );
    }

    await sharp(file.buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).ensureAlpha().raw().toBuffer();
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(
      'The uploaded image is malformed or could not be safely decoded.',
    );
  }
}

export async function validateChatFileUpload(
  file: Express.Multer.File,
): Promise<void> {
  if (!file) throw new BadRequestException('No attachment uploaded.');
  if (file.size > 15 * 1024 * 1024) {
    throw new BadRequestException('Attachment must not exceed 15 MB.');
  }

  const ext = extensionOf(file.originalname);

  // Text files have no reliable magic signature. Keep them plain UTF-8 text
  // and reject binary/control-heavy payloads instead of trusting the extension.
  if (ext === 'txt') {
    if (file.mimetype !== 'text/plain') {
      throw new BadRequestException('Invalid text attachment MIME type.');
    }
    const text = file.buffer.toString('utf8');
    if (text.includes('\uFFFD') || /\u0000/.test(text)) {
      throw new BadRequestException('Invalid text attachment content.');
    }
    return;
  }

  const expectedMime = CHAT_BINARY_TYPES.get(ext);
  const detected = await fileTypeFromBuffer(file.buffer);

  if (!expectedMime || !detected || detected.mime !== expectedMime) {
    throw new BadRequestException(
      'Invalid attachment content. The extension, MIME type and actual file format must match.',
    );
  }

  if (file.mimetype !== detected.mime) {
    throw new BadRequestException('Invalid attachment MIME type.');
  }

  // Reject legacy Office binary documents and archive formats not explicitly
  // supported by this endpoint. This keeps the accepted attack surface small.
  if (ext === 'docx' && detected.ext !== 'docx') {
    throw new BadRequestException('Invalid DOCX attachment.');
  }
}
