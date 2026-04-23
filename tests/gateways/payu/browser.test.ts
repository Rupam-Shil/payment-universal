import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { payuBrowser } from '../../../src/gateways/payu/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('payuBrowser', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reports capabilities { modal: false, redirect: true }', () => {
    const adapter = payuBrowser();
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError synchronously', async () => {
    const adapter = payuBrowser();
    await expect(
      adapter.openCheckout({
        order: {
          id: 'txn',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'payu',
          clientPayload: {},
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode builds and submits a form with expected fields', async () => {
    const adapter = payuBrowser();

    // Intercept form.submit
    const origSubmit = HTMLFormElement.prototype.submit;
    let submittedForm: HTMLFormElement | null = null;
    HTMLFormElement.prototype.submit = function (this: HTMLFormElement) {
      submittedForm = this;
    };

    try {
      void adapter.openCheckout({
        order: {
          id: 'txn_abc',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'payu',
          clientPayload: {
            url: 'https://test.payu.in/_payment',
            key: 'KEY',
            txnid: 'txn_abc',
            amount: '499.00',
            productinfo: 'course',
            firstname: 'Alice',
            email: 'a@b.com',
            phone: '',
            hash: 'abc',
          },
          raw: {},
        },
        mode: 'redirect',
        returnUrl: 'https://merchant.test/return',
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(submittedForm).not.toBeNull();
      expect(submittedForm!.method).toBe('post');
      expect(submittedForm!.action).toBe('https://test.payu.in/_payment');
      const fields: Record<string, string> = {};
      submittedForm!
        .querySelectorAll<HTMLInputElement>('input[type="hidden"]')
        .forEach((el) => {
          fields[el.name] = el.value;
        });
      expect(fields).toMatchObject({
        key: 'KEY',
        txnid: 'txn_abc',
        amount: '499.00',
        productinfo: 'course',
        firstname: 'Alice',
        email: 'a@b.com',
        hash: 'abc',
        surl: 'https://merchant.test/return',
        furl: 'https://merchant.test/return',
      });
    } finally {
      HTMLFormElement.prototype.submit = origSubmit;
    }
  });
});
