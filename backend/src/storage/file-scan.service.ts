import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class FileScanService {
  constructor(private readonly configService: ConfigService) {}

  async scan(file: Express.Multer.File): Promise<void> {
    const enabledValue = this.configService.get<boolean | string>('CLAMAV_ENABLED');
    const enabled =
      enabledValue === true ||
      (typeof enabledValue === 'string' && enabledValue.toLowerCase() === 'true');

    const nodeEnv = this.configService.get<string>('NODE_ENV')?.toLowerCase();
    const production = nodeEnv === 'production';

    if (!enabled) {
      if (production) {
        throw new InternalServerErrorException(
          'File scanning is not configured.',
        );
      }
      return;
    }

    const workDir = await mkdtemp(join(tmpdir(), 'rentitease-scan-'));
    const extension = extname(file.originalname).toLowerCase() || '.bin';
    const inputPath = join(workDir, `upload${extension}`);

    try {
      await writeFile(inputPath, file.buffer);
      const scanner =
        this.configService.get<string>('CLAMAV_PATH')?.trim() || 'clamscan';

      try {
        await execFileAsync(
          scanner,
          ['--no-summary', '--infected', inputPath],
          { timeout: 30_000, maxBuffer: 1024 * 1024 },
        );
      } catch (error: any) {
        const exitCode = typeof error?.code === 'number' ? error.code : null;

        if (exitCode === 1) {
          throw new BadRequestException(
            'The uploaded file was rejected by the security scanner.',
          );
        }

        throw new InternalServerErrorException(
          'File security scanning failed. Please try again later.',
        );
      }
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
