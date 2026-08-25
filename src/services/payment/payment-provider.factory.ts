import { IPaymentProviderAdapter } from './payment-provider.interface';
import { MidtransPaymentAdapter } from './adapters/midtrans.adapter';
import { SimulatorPaymentAdapter } from './adapters/simulator.adapter';

export function getPaymentAdapter(): IPaymentProviderAdapter {
  const provider = (process.env.PAYMENT_PROVIDER || '').toUpperCase();

  if (provider === 'SIMULATOR') {
    return new SimulatorPaymentAdapter();
  }

  // Default to Midtrans adapter, which automatically handles fallback if credentials are absent
  return new MidtransPaymentAdapter();
}
