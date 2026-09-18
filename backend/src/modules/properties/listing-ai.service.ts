import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class ListingAiService {
  private readonly logger = new Logger(ListingAiService.name);

  async suggest(input: Record<string, unknown>) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured.');
      throw new ServiceUnavailableException('AI suggestions are not configured.');
    }

    const model = process.env.OPENAI_LISTING_MODEL || 'gpt-4o-mini';
    const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    let lastError: unknown;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You write accurate rental listings. Return only a JSON object with exactly two non-empty string fields: title and description. Never invent amenities, location details, prices, or other facts.',
              },
              {
                role: 'user',
                content: `Create a concise rental title and an honest two-sentence description using only these supplied property facts: ${JSON.stringify(input)}`,
              },
            ],
          }),
        });

        const requestId = response.headers.get('x-request-id') || 'unknown';
        const rawBody = await response.text();
        let body: any = null;
        if (rawBody) {
          try {
            body = JSON.parse(rawBody);
          } catch {
            body = null;
          }
        }

        if (!response.ok) {
          const providerCode = body?.error?.code || body?.error?.type || 'unknown';
          this.logger.warn(
            `OpenAI listing suggestion failed: status=${response.status} code=${providerCode} model=${model} requestId=${requestId} attempt=${attempt}`,
          );

          if (response.status === 401 || response.status === 403) {
            throw new ServiceUnavailableException('AI configuration needs attention.');
          }
          if (response.status === 400 && body?.error?.param === 'response_format') {
            this.logger.warn('Configured OpenAI model does not support JSON response format.');
            throw new ServiceUnavailableException('AI model configuration needs attention.');
          }
          if (response.status === 429) {
            if (attempt < 2) {
              await this.delay(750);
              continue;
            }
            throw new ServiceUnavailableException('AI service is busy. Please try again shortly.');
          }
          if (response.status >= 500 && attempt < 2) {
            await this.delay(750);
            continue;
          }
          throw new ServiceUnavailableException('AI suggestions are temporarily unavailable. Please retry.');
        }

        const content = body?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          this.logger.warn(
            `OpenAI returned no listing content: model=${model} requestId=${requestId} attempt=${attempt}`,
          );
          if (attempt < 2) {
            await this.delay(500);
            continue;
          }
          throw new ServiceUnavailableException('AI returned no suggestion. Please retry.');
        }

        const parsed = this.parseSuggestion(content);
        if (!parsed) {
          this.logger.warn(
            `OpenAI returned an invalid listing payload: model=${model} requestId=${requestId} attempt=${attempt}`,
          );
          if (attempt < 2) {
            await this.delay(500);
            continue;
          }
          throw new ServiceUnavailableException('AI returned an incomplete suggestion. Please retry.');
        }

        return parsed;
      } catch (error) {
        lastError = error;
        if (error instanceof ServiceUnavailableException) throw error;

        const isTimeout = (error as Error)?.name === 'AbortError';
        this.logger.warn(
          `OpenAI listing suggestion request error: type=${(error as Error)?.name || 'unknown'} model=${model} attempt=${attempt}`,
        );
        if (attempt < 2) {
          await this.delay(750);
          continue;
        }
        if (isTimeout) {
          throw new ServiceUnavailableException('AI suggestion timed out. Please try again.');
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    this.logger.error(
      `Unable to generate AI listing suggestion after retries: type=${(lastError as Error)?.name || 'unknown'} model=${model}`,
    );
    throw new ServiceUnavailableException('Unable to generate AI suggestion. Please retry.');
  }

  private parseSuggestion(content: string): { title: string; description: string } | null {
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as { title?: unknown; description?: unknown };
      const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
      return title && description ? { title, description } : null;
    } catch {
      return null;
    }
  }

  private delay(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
