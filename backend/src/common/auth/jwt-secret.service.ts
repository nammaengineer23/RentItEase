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

  private getSecrets(currentName: string, previousName: string): string[] {
    const current = this.getRequired(currentName);
    const previous = this.configService.get<string>(previousName)?.trim();

    return previous && previous !== current ? [current, previous] : [current];
  }

  private getRequired(name: string): string {
    const value = this.configService.get<string>(name)?.trim();

    if (!value) {
      throw new Error(`${name} is required.`);
    }

    return value;
  }
}
