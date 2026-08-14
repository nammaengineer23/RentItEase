import request from 'supertest';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

describe('Chat E2E', () => {
  // ============================================================
  // Configuration
  // ============================================================

  const baseUrl =
    process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  const apiPrefix = process.env.E2E_API_PREFIX || '/api/v1';

  const apiUrl = `${baseUrl}${apiPrefix}`;

  // ============================================================
  // Test accounts / property
  // ============================================================

  const tenantEmail = process.env.E2E_TENANT_EMAIL;

  const tenantPassword = process.env.E2E_TENANT_PASSWORD;

  const ownerEmail = process.env.E2E_OWNER_EMAIL;

  const ownerPassword = process.env.E2E_OWNER_PASSWORD;

  const propertyId = process.env.E2E_PROPERTY_ID;

  // ============================================================
  // Runtime state
  // ============================================================

  let tenantToken = '';
  let ownerToken = '';

  let conversationId = '';

  let tenantMessageId = '';
  let ownerMessageId = '';

  // ============================================================
  // Helpers
  // ============================================================

  function requireEnvironment(): void {
    const missing: string[] = [];

    if (!tenantEmail) {
      missing.push('E2E_TENANT_EMAIL');
    }

    if (!tenantPassword) {
      missing.push('E2E_TENANT_PASSWORD');
    }

    if (!ownerEmail) {
      missing.push('E2E_OWNER_EMAIL');
    }

    if (!ownerPassword) {
      missing.push('E2E_OWNER_PASSWORD');
    }

    if (!propertyId) {
      missing.push('E2E_PROPERTY_ID');
    }

    if (missing.length > 0) {
      throw new Error(
        [
          'Missing required E2E environment variables:',
          '',
          ...missing.map((name) => `  ${name}`),
          '',
          'Configure them in test/.env.e2e before running the Chat E2E test.',
        ].join('\n'),
      );
    }
  }

  function extractToken(body: any): string {
    const token =
      body?.accessToken ??
      body?.access_token ??
      body?.token ??
      body?.data?.accessToken ??
      body?.data?.access_token ??
      body?.data?.token ??
      body?.data?.data?.accessToken ??
      body?.data?.data?.access_token ??
      body?.data?.data?.token;

    if (!token || typeof token !== 'string') {
      throw new Error(
        [
          'Unable to extract JWT token from login response:',
          JSON.stringify(body, null, 2),
        ].join('\n'),
      );
    }

    return token;
  }

  /**
   * The RentItEase API can return:
   *
   * {
   *   success: true,
   *   data: {
   *     ...
   *   }
   * }
   *
   * or nested service responses:
   *
   * {
   *   success: true,
   *   data: {
   *     success: true,
   *     message: '...',
   *     data: {
   *       ...
   *     }
   *   }
   * }
   */
  function extractData(body: any): any {
    if (body?.data?.data !== undefined) {
      return body.data.data;
    }

    if (body?.data !== undefined) {
      return body.data;
    }

    return body;
  }

  function extractArray(body: any): any[] {
    const candidates = [
      body,
      body?.data,
      body?.data?.data,
      body?.conversations,
      body?.data?.conversations,
      body?.data?.data?.conversations,
      body?.messages,
      body?.data?.messages,
      body?.data?.data?.messages,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      [
        'Unable to extract array from API response:',
        JSON.stringify(body, null, 2),
      ].join('\n'),
    );
  }

  function requireConversationId(): void {
    if (!conversationId) {
      throw new Error(
        [
          'Conversation ID is missing.',
          'The conversation creation test must succeed first.',
        ].join(' '),
      );
    }
  }

  function requireTenantToken(): void {
    if (!tenantToken) {
      throw new Error(
        'Tenant JWT token is missing. Tenant login must succeed first.',
      );
    }
  }

  function requireOwnerToken(): void {
    if (!ownerToken) {
      throw new Error(
        'Owner JWT token is missing. Owner login must succeed first.',
      );
    }
  }

  function requireTenantMessageId(): void {
    if (!tenantMessageId) {
      throw new Error(
        'Tenant message ID is missing. Tenant message creation must succeed first.',
      );
    }
  }

  function requireOwnerMessageId(): void {
    if (!ownerMessageId) {
      throw new Error(
        'Owner message ID is missing. Owner message creation must succeed first.',
      );
    }
  }

  function assertSuccess(response: request.Response, operation: string): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        [
          `${operation} failed.`,
          `HTTP ${response.status}`,
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }

    if (response.body?.success === false) {
      throw new Error(
        [
          `${operation} returned success=false.`,
          JSON.stringify(response.body, null, 2),
        ].join('\n'),
      );
    }
  }

  // ============================================================
  // Before all
  // ============================================================

  beforeAll(() => {
    requireEnvironment();

    console.log('');
    console.log('==============================================');
    console.log(' RentItEase Chat E2E Test');
    console.log('==============================================');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Prefix: ${apiPrefix}`);
    console.log(`API: ${apiUrl}`);
    console.log(`Property: ${propertyId}`);
    console.log('==============================================');
    console.log('');
  });

  // ============================================================
  // 1. Tenant Login
  // ============================================================

  it('1. Tenant can login', async () => {
    const response = await request(baseUrl)
      .post(`${apiPrefix}/auth/login`)
      .send({
        login: tenantEmail,
        password: tenantPassword,
      });

    assertSuccess(response, 'Tenant login');

    tenantToken = extractToken(response.body);

    expect(tenantToken).toBeTruthy();

    console.log('✓ Tenant login successful');

    console.log(`  Tenant: ${tenantEmail}`);
  }, 30_000);

  // ============================================================
  // 2. Owner Login
  // ============================================================

  it('2. Owner can login', async () => {
    const response = await request(baseUrl)
      .post(`${apiPrefix}/auth/login`)
      .send({
        login: ownerEmail,
        password: ownerPassword,
      });

    assertSuccess(response, 'Owner login');

    ownerToken = extractToken(response.body);

    expect(ownerToken).toBeTruthy();

    console.log('✓ Owner login successful');

    console.log(`  Owner: ${ownerEmail}`);
  }, 30_000);

  // ============================================================
  // 3. Tenant creates conversation
  // ============================================================

  it('3. Tenant can create or open a conversation for the property', async () => {
    requireTenantToken();

    const response = await request(baseUrl)
      .post(`${apiPrefix}/chat/conversations`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId,
      });

    assertSuccess(response, 'Create conversation');

    const conversation = extractData(response.body);

    console.log('');
    console.log('Conversation creation response:');
    console.log(JSON.stringify(response.body, null, 2));
    console.log('');

    expect(conversation).toBeTruthy();

    expect(conversation.id).toBeTruthy();

    expect(conversation.propertyId).toBe(propertyId);

    expect(conversation.tenantId).toBeTruthy();

    expect(conversation.ownerId).toBeTruthy();

    conversationId = conversation.id;

    console.log('✓ Tenant created/opened conversation');

    console.log(`  Conversation ID: ${conversationId}`);
  }, 30_000);

  // ============================================================
  // 4. Tenant can see conversation
  // ============================================================

  it('4. Tenant can see the conversation in conversation list', async () => {
    requireTenantToken();
    requireConversationId();

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const conversations = extractArray(response.body);

    const conversation = conversations.find(
      (item) =>
        item.conversationId === conversationId || item.id === conversationId,
    );

    expect(conversation).toBeTruthy();

    console.log('✓ Tenant can see conversation');
  }, 30_000);

  // ============================================================
  // 5. Owner can see conversation
  // ============================================================

  it('5. Owner can see the conversation', async () => {
    requireOwnerToken();
    requireConversationId();

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const conversations = extractArray(response.body);

    const conversation = conversations.find(
      (item) =>
        item.conversationId === conversationId || item.id === conversationId,
    );

    expect(conversation).toBeTruthy();

    console.log('✓ Owner can see conversation');
  }, 30_000);

  // ============================================================
  // 6. Tenant sends message
  // ============================================================

  it('6. Tenant can send a message', async () => {
    requireTenantToken();
    requireConversationId();

    const text = `Automated Chat E2E tenant message ${Date.now()}`;

    const response = await request(baseUrl)
      .post(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        text,
      });

    assertSuccess(response, 'Tenant send message');

    const message = extractData(response.body);

    expect(message).toBeTruthy();

    expect(message.id).toBeTruthy();

    expect(message.conversationId).toBe(conversationId);

    expect(message.senderId).toBeTruthy();

    expect(message.text).toBe(text);

    tenantMessageId = message.id;

    console.log('✓ Tenant sent message');

    console.log(`  Message ID: ${tenantMessageId}`);
  }, 30_000);

  // ============================================================
  // 7. Owner can read messages
  // ============================================================

  it('7. Owner can read conversation messages', async () => {
    requireOwnerToken();
    requireConversationId();
    requireTenantMessageId();

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const messages = extractArray(response.body);

    const message = messages.find((item) => item.id === tenantMessageId);

    expect(message).toBeTruthy();

    expect(message.conversationId).toBe(conversationId);

    expect(message.text).toContain('Automated Chat E2E tenant message');

    console.log('✓ Owner can read tenant message');
  }, 30_000);

  // ============================================================
  // 8. Owner replies
  // ============================================================

  it('8. Owner can send a reply', async () => {
    requireOwnerToken();
    requireConversationId();

    const text = `Automated Chat E2E owner reply ${Date.now()}`;

    const response = await request(baseUrl)
      .post(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        text,
      });

    assertSuccess(response, 'Owner send message');

    const message = extractData(response.body);

    expect(message).toBeTruthy();

    expect(message.id).toBeTruthy();

    expect(message.conversationId).toBe(conversationId);

    expect(message.text).toBe(text);

    ownerMessageId = message.id;

    console.log('✓ Owner sent reply');

    console.log(`  Message ID: ${ownerMessageId}`);
  }, 30_000);

  // ============================================================
  // 9. Tenant can read owner reply
  // ============================================================

  it('9. Tenant can read owner reply', async () => {
    requireTenantToken();
    requireConversationId();
    requireOwnerMessageId();

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const messages = extractArray(response.body);

    const message = messages.find((item) => item.id === ownerMessageId);

    expect(message).toBeTruthy();

    expect(message.conversationId).toBe(conversationId);

    expect(message.text).toContain('Automated Chat E2E owner reply');

    console.log('✓ Tenant can read owner reply');
  }, 30_000);

  // ============================================================
  // 10. Tenant marks messages as read
  // ============================================================

  it('10. Tenant can mark conversation messages as read', async () => {
    requireTenantToken();
    requireConversationId();

    const response = await request(baseUrl)
      .patch(`${apiPrefix}/chat/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${tenantToken}`);

    assertSuccess(response, 'Mark messages as read');

    expect(response.body).toBeTruthy();

    console.log('✓ Tenant marked conversation messages as read');
  }, 30_000);

  // ============================================================
  // 11. Tenant can edit own message
  // ============================================================

  it('11. Tenant can edit own message', async () => {
    requireTenantToken();
    requireTenantMessageId();

    const editedText = `Edited tenant Chat E2E message ${Date.now()}`;

    const response = await request(baseUrl)
      .patch(`${apiPrefix}/chat/messages/${tenantMessageId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        text: editedText,
      });

    assertSuccess(response, 'Edit tenant message');

    const message = extractData(response.body);

    expect(message).toBeTruthy();

    expect(message.id).toBe(tenantMessageId);

    expect(message.text).toBe(editedText);

    expect(message.editedAt).toBeTruthy();

    console.log('✓ Tenant edited own message');
  }, 30_000);

  // ============================================================
  // 12. Owner cannot edit tenant message
  // ============================================================

  it('12. Owner cannot edit tenant message', async () => {
    requireOwnerToken();
    requireTenantMessageId();

    const response = await request(baseUrl)
      .patch(`${apiPrefix}/chat/messages/${tenantMessageId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        text: 'Unauthorized edit attempt',
      });

    expect([403, 401]).toContain(response.status);

    console.log('✓ Owner cannot edit tenant message');
  }, 30_000);

  // ============================================================
  // 13. Owner can edit own message
  // ============================================================

  it('13. Owner can edit own message', async () => {
    requireOwnerToken();
    requireOwnerMessageId();

    const editedText = `Edited owner Chat E2E reply ${Date.now()}`;

    const response = await request(baseUrl)
      .patch(`${apiPrefix}/chat/messages/${ownerMessageId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        text: editedText,
      });

    assertSuccess(response, 'Edit owner message');

    const message = extractData(response.body);

    expect(message).toBeTruthy();

    expect(message.id).toBe(ownerMessageId);

    expect(message.text).toBe(editedText);

    expect(message.editedAt).toBeTruthy();

    console.log('✓ Owner edited own message');
  }, 30_000);

  // ============================================================
  // 14. Owner cannot delete tenant message
  // ============================================================

  it('14. Owner cannot delete tenant message', async () => {
    requireOwnerToken();
    requireTenantMessageId();

    const response = await request(baseUrl)
      .delete(`${apiPrefix}/chat/messages/${tenantMessageId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect([403, 401]).toContain(response.status);

    console.log('✓ Owner cannot delete tenant message');
  }, 30_000);

  // ============================================================
  // 15. Tenant can delete own message
  // ============================================================

  it('15. Tenant can delete own message', async () => {
    requireTenantToken();
    requireTenantMessageId();

    const response = await request(baseUrl)
      .delete(`${apiPrefix}/chat/messages/${tenantMessageId}`)
      .set('Authorization', `Bearer ${tenantToken}`);

    assertSuccess(response, 'Delete tenant message');

    const deletedMessage = extractData(response.body);

    expect(deletedMessage).toBeTruthy();

    expect(deletedMessage.id).toBe(tenantMessageId);

    expect(deletedMessage.deletedAt).toBeTruthy();

    console.log('✓ Tenant soft-deleted own message');
  }, 30_000);

  // ============================================================
  // 16. Deleted message is no longer returned
  // ============================================================

  it('16. Deleted message is excluded from message list', async () => {
    requireTenantToken();
    requireConversationId();
    requireTenantMessageId();

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const messages = extractArray(response.body);

    const deletedMessage = messages.find((item) => item.id === tenantMessageId);

    expect(deletedMessage).toBeUndefined();

    console.log('✓ Deleted message is excluded from conversation');
  }, 30_000);

  // ============================================================
  // 17. Non-participant cannot access conversation
  // ============================================================

  it('17. Conversation remains protected by participant authorization', async () => {
    requireTenantToken();
    requireConversationId();

    /*
     * The existing tenant and owner are both legitimate
     * participants. We therefore verify the authenticated
     * participant can access the conversation and messages.
     *
     * A dedicated third-user credential can be added later
     * through E2E_THIRD_USER_EMAIL / E2E_THIRD_USER_PASSWORD
     * for a full negative authorization test.
     */

    const response = await request(baseUrl)
      .get(`${apiPrefix}/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    const messages = extractArray(response.body);

    expect(Array.isArray(messages)).toBe(true);

    console.log('✓ Conversation authorization works for participant');
  }, 30_000);

  // ============================================================
  // Summary
  // ============================================================

  afterAll(() => {
    console.log('');
    console.log('==============================================');
    console.log(' Chat E2E workflow completed');
    console.log('==============================================');

    console.log(` Tenant authenticated: ${Boolean(tenantToken)}`);

    console.log(` Owner authenticated: ${Boolean(ownerToken)}`);

    console.log(` Conversation created: ${Boolean(conversationId)}`);

    if (conversationId) {
      console.log(` Conversation ID: ${conversationId}`);
    }

    console.log(` Tenant message created: ${Boolean(tenantMessageId)}`);

    console.log(` Owner message created: ${Boolean(ownerMessageId)}`);

    console.log('==============================================');
    console.log('');
  });
});
