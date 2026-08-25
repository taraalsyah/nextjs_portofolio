import crypto from 'crypto';
import { IPaymentProviderAdapter } from '../payment-provider.interface';
import { CreatePaymentParams, PaymentResult, WebhookVerificationResult, PaymentStatus } from '../types';

export class MidtransPaymentAdapter implements IPaymentProviderAdapter {
  name = 'MIDTRANS';

  private getServerKey(): string {
    return process.env.PAYMENT_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '';
  }

  private getIsProduction(): boolean {
    return process.env.PAYMENT_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';
  }

  private getApiUrl(): string {
    return this.getIsProduction()
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';
  }

  async createTransaction(params: CreatePaymentParams, orderId: string, amount: number): Promise<PaymentResult> {
    const serverKey = this.getServerKey();
    if (!serverKey) {
      console.warn('[MidtransPaymentAdapter] Midtrans Server Key not configured. Fallback to SIMULATOR adapter values.');
    }

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
    const method = (params.paymentMethod || 'qris').toLowerCase();
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    let paymentType = 'qris';
    let bodyPayload: any = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: params.userName,
        email: params.userEmail,
      },
      qris: {
        acquirer: 'gopay',
      },
    };

    if (method.startsWith('va_')) {
      const bankName = method.replace('va_', '').toLowerCase();
      paymentType = 'bank_transfer';
      bodyPayload = {
        payment_type: 'bank_transfer',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: params.userName,
          email: params.userEmail,
        },
        bank_transfer: {
          bank: bankName === 'mandiri' ? 'echannel' : bankName,
        },
      };
    } else if (method === 'gopay') {
      paymentType = 'gopay';
      bodyPayload = {
        payment_type: 'gopay',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        gopay: {
          enable_callback: true,
          callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        },
      };
    }

    let resultQrUrl: string | undefined = undefined;
    let resultVaNumber: string | undefined = undefined;
    let resultBank: string | undefined = undefined;
    let resultPaymentUrl: string | undefined = undefined;
    let externalRef: string = orderId;

    try {
      if (serverKey) {
        const response = await fetch(`${this.getApiUrl()}/charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        const json = await response.json();
        if (response.ok && json.status_code === '201') {
          externalRef = json.transaction_id || orderId;

          if (json.actions) {
            const qrAction = json.actions.find((a: any) => a.name === 'generate-qr-code');
            if (qrAction) resultQrUrl = qrAction.url;
            const deeplinkAction = json.actions.find((a: any) => a.name === 'deeplink-redirect');
            if (deeplinkAction) resultPaymentUrl = deeplinkAction.url;
          }

          if (json.va_numbers && json.va_numbers.length > 0) {
            resultVaNumber = json.va_numbers[0].va_number;
            resultBank = json.va_numbers[0].bank?.toUpperCase();
          } else if (json.permata_va_number) {
            resultVaNumber = json.permata_va_number;
            resultBank = 'PERMATA';
          }
        }
      }
    } catch (err) {
      console.error('[MidtransPaymentAdapter] API Error:', err);
    }

    // Fallback QR code generator if Midtrans API didn't return a live QR URL (for dev/testing compatibility)
    if (!resultQrUrl && (method === 'qris' || method === 'gopay')) {
      const qrData = `00020101021226680016COM.MIDTRANS.WWW011893600914000000000002152004599953033605405${amount}5802ID5914ProjectGateway6007Jakarta6304${orderId}`;
      resultQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=280`;
    }

    if (!resultVaNumber && method.startsWith('va_')) {
      const bankName = method.replace('va_', '').toUpperCase();
      resultBank = bankName;
      resultVaNumber = `88301${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    return {
      transactionId: orderId,
      externalReference: externalRef,
      status: 'PENDING',
      amount,
      currency: 'IDR',
      paymentMethod: method,
      paymentProvider: this.name,
      paymentUrl: resultPaymentUrl,
      qrUrl: resultQrUrl,
      vaNumber: resultVaNumber,
      bank: resultBank,
      expiredAt,
    };
  }

  async verifyWebhook(payload: any): Promise<WebhookVerificationResult> {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false };
    }

    const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;
    const serverKey = this.getServerKey();

    // Verify Midtrans SHA512 signature if serverKey exists and signature_key was sent
    if (serverKey && signature_key) {
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');

      if (signature_key !== expectedSignature) {
        console.error('[MidtransPaymentAdapter] Webhook Signature mismatch!');
        return { isValid: false };
      }
    }

    let status: PaymentStatus = 'PENDING';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      status = 'PAID';
    } else if (transaction_status === 'expire') {
      status = 'EXPIRED';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
      status = 'CANCELLED';
    }

    const numericAmount = Math.round(parseFloat(String(gross_amount || 0)));

    return {
      isValid: true,
      transactionId: order_id,
      status,
      amount: numericAmount,
      rawPayload: payload,
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentResult> {
    const serverKey = this.getServerKey();
    if (!serverKey) {
      return {
        transactionId,
        status: 'PENDING',
        amount: 30000,
        currency: 'IDR',
        paymentMethod: 'qris',
        paymentProvider: this.name,
      };
    }

    try {
      const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
      const response = await fetch(`${this.getApiUrl()}/${transactionId}/status`, {
        headers: { Authorization: `Basic ${authHeader}` },
      });
      const json = await response.json();

      let status: PaymentStatus = 'PENDING';
      if (json.transaction_status === 'settlement' || json.transaction_status === 'capture') {
        status = 'PAID';
      } else if (json.transaction_status === 'expire') {
        status = 'EXPIRED';
      } else if (json.transaction_status === 'deny' || json.transaction_status === 'cancel') {
        status = 'CANCELLED';
      }

      return {
        transactionId,
        externalReference: json.transaction_id,
        status,
        amount: Math.round(parseFloat(json.gross_amount || 30000)),
        currency: 'IDR',
        paymentMethod: json.payment_type || 'qris',
        paymentProvider: this.name,
      };
    } catch (err) {
      console.error('[MidtransPaymentAdapter] checkStatus error:', err);
      return {
        transactionId,
        status: 'PENDING',
        amount: 30000,
        currency: 'IDR',
        paymentMethod: 'qris',
        paymentProvider: this.name,
      };
    }
  }
}
