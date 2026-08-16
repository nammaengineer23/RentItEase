import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { apiUrl, extractData, login, statusOk } from './helpers';

describe('Release E2E • Invoice', () => {
  it('payment → invoice → paid → history/view', async () => {
    const loginResult = await login(
      process.env.E2E_TENANT_LOGIN!,
      process.env.E2E_TENANT_PASSWORD!,
    );
    const userId = extractData(loginResult.body)?.user?.id ?? extractData(loginResult.body)?.id;
    const paymentId = process.env.E2E_PAYMENT_ID;
    if (!userId || !paymentId) {
      throw new Error('Run Payment E2E first so E2E_PAYMENT_ID is available.');
    }

    const create = await request(apiUrl())
      .post('/invoices')
      .send({
        userId,
        paymentId,
        amount: 1000,
        taxAmount: 0,
        description: 'RentItEase E2E invoice',
        currency: 'INR',
      });
    statusOk(create);
    const invoice = extractData(create.body);
    const invoiceId = invoice?.id;
    const invoiceNumber = invoice?.invoiceNumber;
    expect(invoiceId).toBeTruthy();
    expect(invoiceNumber).toBeTruthy();

    const view = await request(apiUrl())
      .get(`/invoices/${invoiceId}`)
      .expect(200);
    expect(extractData(view.body)?.id).toBe(invoiceId);

    const history = await request(apiUrl())
      .get(`/invoices/user/${userId}`)
      .expect(200);
    expect(JSON.stringify(history.body)).toContain(invoiceId);

    const paid = await request(apiUrl())
      .patch(`/invoices/${invoiceId}/paid`);
    statusOk(paid);
    expect(extractData(paid.body)?.status).toBe('PAID');
  });
});
