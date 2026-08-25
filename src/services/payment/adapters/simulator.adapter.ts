import { IPaymentProviderAdapter } from '../payment-provider.interface';
import { CreatePaymentParams, PaymentResult, WebhookVerificationResult, PaymentStatus } from '../types';

export class SimulatorPaymentAdapter implements IPaymentProviderAdapter {
  name = 'SIMULATOR';

  async createTransaction(params: CreatePaymentParams, orderId: string, amount: number): Promise<PaymentResult> {
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const method = (params.paymentMethod || 'qris').toLowerCase();

    let qrUrl: string | undefined = undefined;
    let vaNumber: string | undefined = undefined;
    let bank: string | undefined = undefined;
    let paymentUrl: string | undefined = undefined;

    if (method === 'qris' || method.includes('gopay') || method.includes('shopeepay')) {
      const qrData = `00020101021226680016COM.MIDTRANS.WWW011893600914000000000002152004599953033605405${amount}5802ID5914ProjectGateway6007Jakarta6304${orderId}`;
      qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=280`;
    } else if (method.startsWith('va_') || method === 'bank_transfer') {
      const bankName = method.replace('va_', '').toUpperCase();
      bank = bankName === 'BANK_TRANSFER' ? 'BCA' : bankName;
      const bankPrefixes: Record<string, string> = {
        BCA: '88301',
        BNI: '88081',
        BRI: '88021',
        MANDIRI: '88001',
        PERMATA: '88111',
      };
      const prefix = bankPrefixes[bank] || '88301';
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      vaNumber = `${prefix}${randomDigits}`;
    }

    paymentUrl = `/dashboard?payment_order_id=${orderId}`;

    return {
      transactionId: orderId,
      externalReference: `SIM-${Date.now()}`,
      status: 'PENDING',
      amount,
      currency: 'IDR',
      paymentMethod: method,
      paymentProvider: this.name,
      paymentUrl,
      qrUrl,
      vaNumber,
      bank,
      expiredAt,
    };
  }

  async verifyWebhook(payload: any, headers?: Record<string, string>): Promise<WebhookVerificationResult> {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false };
    }

    const { transactionId, orderId, status, amount, signature } = payload;
    const targetOrderId = orderId || transactionId;

    if (!targetOrderId) {
      return { isValid: false };
    }

    // Secret verification if provided
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret && signature && signature !== webhookSecret) {
      return { isValid: false };
    }

    let mappedStatus: PaymentStatus = 'PENDING';
    const rawStatus = String(status || '').toUpperCase();
    if (rawStatus === 'PAID' || rawStatus === 'SETTLEMENT' || rawStatus === 'SUCCESS') {
      mappedStatus = 'PAID';
    } else if (rawStatus === 'EXPIRED') {
      mappedStatus = 'EXPIRED';
    } else if (rawStatus === 'FAILED' || rawStatus === 'DENY') {
      mappedStatus = 'FAILED';
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCEL') {
      mappedStatus = 'CANCELLED';
    }

    return {
      isValid: true,
      transactionId: targetOrderId,
      status: mappedStatus,
      amount: typeof amount === 'number' ? amount : parseInt(String(amount || 30000), 10),
      rawPayload: payload,
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentResult> {
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
