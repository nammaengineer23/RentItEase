import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, auth, createApprovedE2EProperty, extractData, login, statusOk } from './helpers';

describe('Release E2E • Chat', () => {
  it('send → read → edit → delete', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );
    const token = tenant.token;
    const owner = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );
    const admin = await login(
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );
    const propertyId = await createApprovedE2EProperty(
      owner.token,
      admin.token,
      'Release Chat',
    );

    let conversationId = '';
    {
      const create = await request(apiUrl())
        .post('/chat/conversations')
        .set(auth(token))
        .send({ propertyId });
      statusOk(create);
      conversationId = extractData(create.body)?.id ?? extractData(create.body)?.conversation?.id;
    }

    if (!conversationId) throw new Error('Unable to obtain chat conversation ID.');

    const sent = await request(apiUrl())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set(auth(token))
      .send({ text: `RentItEase E2E ${Date.now()}` });
    statusOk(sent);
    const messageId =
      extractData(sent.body)?.id ?? extractData(sent.body)?.message?.id;
    expect(messageId).toBeTruthy();

    const messages = await request(apiUrl())
      .get(`/chat/conversations/${conversationId}/messages`)
      .set(auth(token))
      .expect(200);
    expect(JSON.stringify(messages.body)).toContain(messageId);

    const read = await request(apiUrl())
      .patch(`/chat/conversations/${conversationId}/read`)
      .set(auth(token));
    statusOk(read);

    const edit = await request(apiUrl())
      .patch(`/chat/messages/${messageId}`)
      .set(auth(token))
      .send({ text: 'RentItEase E2E edited' });
    statusOk(edit);

    const del = await request(apiUrl())
      .delete(`/chat/messages/${messageId}`)
      .set(auth(token));
    statusOk(del);
  });
});
