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

  it('keeps chat attachments private and issues URLs only to conversation participants after message linkage', async () => {
    const tenant = await login(
      process.env.E2E_TENANT_EMAIL!,
      process.env.E2E_TENANT_PASSWORD!,
    );
    const owner = await login(
      process.env.E2E_OWNER_EMAIL!,
      process.env.E2E_OWNER_PASSWORD!,
    );
    const admin = await login(
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );
    const otherOwner = await login(
      process.env.E2E_OTHER_OWNER_EMAIL!,
      process.env.E2E_OTHER_OWNER_PASSWORD!,
    );
    const propertyId = await createApprovedE2EProperty(
      owner.token,
      admin.token,
      'Release Chat Private Attachment',
    );

    const create = await request(apiUrl())
      .post('/chat/conversations')
      .set(auth(tenant.token))
      .send({ propertyId });
    statusOk(create);
    const conversationId =
      extractData(create.body)?.id ?? extractData(create.body)?.conversation?.id;
    if (!conversationId) throw new Error('Unable to obtain private-attachment conversation ID.');

    const pdf = Buffer.from('%PDF-1.4\\nRentItEase private chat attachment E2E\\n%%EOF');
    const upload = await request(apiUrl())
      .post('/uploads/file')
      .query({ conversationId })
      .set(auth(tenant.token))
      .attach('file', pdf, { filename: 'private-chat-e2e.pdf', contentType: 'application/pdf' })
      .expect(201);
    const uploaded = extractData(upload.body);
    const filename = uploaded?.filename as string;
    expect(filename).toMatch(new RegExp('^chat/' + conversationId + '/'));

    // An uploaded object is not downloadable until a non-deleted message links it.
    await request(apiUrl())
      .get('/uploads/file')
      .query({ conversationId, filename })
      .set(auth(tenant.token))
      .expect(404);

    const sent = await request(apiUrl())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set(auth(tenant.token))
      .send({
        text: 'Private attachment E2E',
        messageType: 'DOCUMENT',
        attachmentPublicId: filename,
        attachmentFileName: 'private-chat-e2e.pdf',
        attachmentMimeType: 'application/pdf',
        attachmentSize: pdf.length,
      });
    statusOk(sent);

    const access = await request(apiUrl())
      .get('/uploads/file')
      .query({ conversationId, filename })
      .set(auth(tenant.token))
      .expect(200);
    const signedUrl = extractData(access.body)?.fileUrl as string;
    expect(signedUrl).toMatch(/^https:\/\/storage\.googleapis\.com\//);

    await request(apiUrl())
      .get('/uploads/file')
      .query({ conversationId, filename })
      .set(auth(otherOwner.token))
      .expect(403);
  });

});
