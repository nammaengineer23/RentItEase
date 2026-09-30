import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtSecretService {
  constructor(private readonly configService: ConfigService) {}

  getAccessSecrets(): string[] {
    return this.getSecrets('JWT_ACCESS_SECRET', 'JWT_ACCESS_SECRET_PREVIOUS');
  }

  getRefreshSecrets(): string[] {
    return this.getSecrets('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET_PREVIOUS');
  }

  getCurrentAccessSecret(): string {
    return this.getRequired('JWT_ACCESS_SECRET');
  }

  getCurrentRefreshSecret(): string {
    return this.getRequired('JWT_REFRESH_SECRET');
  }

  getCurrentAccessKeyId(): string {
    return this.configService.get<string>('JWT_ACCESS_KEY_ID')?.trim() || 'v1';
  }

  getPreviousAccessKeyId(): string | undefined {
    return this.configService.get<string>('JWT_ACCESS_KEY_PREVIOUS_ID')?.trim() || undefined;
  }

  getCurrentRefreshKeyId(): string {
    return this.configService.get<string>('JWT_REFRESH_KEY_ID')?.trim() || 'v1';
  }

  getPreviousRefreshKeyId(): string | undefined {
    return this.configService.get<string>('JWT_REFRESH_KEY_PREVIOUS_ID')?.trim() || undefined;
  }

  selectAccessSecret(kid?: string): string {
    return this.selectSecret(
      kid,
      this.getCurrentAccessSecret(),
      this.configService.get<string>('JWT_ACCESS_SECRET_PREVIOUS'),
      this.getCurrentAccessKeyId(),
      this.getPreviousAccessKeyId(),
    );
  }

  selectRefreshSecret(kid?: string): string {
    return this.selectSecret(
      kid,
      this.getCurrentRefreshSecret(),
      this.configService.get<string>('JWT_REFRESH_SECRET_PREVIOUS'),
      this.getCurrentRefreshKeyId(),
      this.getPreviousRefreshKeyId(),
    );
  }

  private getSecrets(currentName: string, previousName: string): string[] {
    const current = this.getRequired(currentName);
    const previous = this.configService.get<string>(previousName)?.trim();

    return previous && previous !== current ? [current, previous] : [current];
  }

  private selectSecret(
    kid: string | undefined,
    current: string,
    previous: string | undefined,
    currentKid: string,
    previousKid: string | undefined,
  ): string {
    if (!kid) {
      if (previous && previous !== current) {
        return previous;
      }
      return current;
    }

    if (kid === currentKid) {
      return current;
    }

    if (previous && previous !== current && kid === previousKid) {
      return previous;
    }

    throw new Error('Unknown JWT key id.');
  }

  private getRequired(name: string): string {
    const value = this.configService.get<string>(name)?.trim();

    if (!value) {
      throw new Error(`${name} is required.`);
    }

    return value;
  }
}
