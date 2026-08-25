import { CreatePaymentParams, PaymentResult, WebhookVerificationResult } from './types';

export interface IPaymentProviderAdapter {
  name: string;
  createTransaction(params: CreatePaymentParams, orderId: string, amount: number): Promise<PaymentResult>;
  verifyWebhook(payload: any, headers?: Record<string, string>): Promise<WebhookVerificationResult>;
  checkStatus(transactionId: string): Promise<PaymentResult>;
}
