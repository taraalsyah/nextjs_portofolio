export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export type PaymentMethodType =
  | 'qris'
  | 'va_bca'
  | 'va_bni'
  | 'va_bri'
  | 'va_mandiri'
  | 'va_permata'
  | 'gopay'
  | 'shopeepay';

export interface CreatePaymentParams {
  userId: number;
  userEmail: string;
  userName: string;
  paymentMethod: PaymentMethodType | string;
  projectName?: string;
  description?: string;
  visibility?: 'PRIVATE' | 'TEAM';
}

export interface PaymentResult {
  transactionId: string;
  externalReference?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentUrl?: string;
  qrUrl?: string;
  vaNumber?: string;
  bank?: string;
  expiredAt?: Date;
  createdProjectId?: number;
  projectName?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  transactionId?: string;
  status?: PaymentStatus;
  amount?: number;
  rawPayload?: any;
}
