import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class ListingAiService {
  async suggest(input: Record<string, unknown>) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('AI suggestions are not configured.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_LISTING_MODEL || 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: 220,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You write accurate rental listings. Return a JSON object with exactly two non-empty string fields: title and description. Never invent amenities or facts.' },
            { role: 'user', content: `Create a concise title and an honest two-sentence description for this rental property: ${JSON.stringify(input)}` },
          ],
        }),
      });
      const body = (await response.json().catch(() => null)) as any;
      if (!response.ok) {
        const detail = body?.error?.message || `OpenAI request failed (${response.status}).`;
        throw new ServiceUnavailableException(detail);
      }
      const content = body?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new ServiceUnavailableException('AI returned no suggestion.');
      const parsed = JSON.parse(content) as { title?: unknown; description?: unknown };
      const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
      if (!title || !description) throw new ServiceUnavailableException('AI returned an incomplete suggestion.');
      return { title, description };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if ((error as Error)?.name === 'AbortError') throw new ServiceUnavailableException('AI suggestion timed out. Please retry.');
      throw new ServiceUnavailableException('Unable to generate AI suggestion. Please retry.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
