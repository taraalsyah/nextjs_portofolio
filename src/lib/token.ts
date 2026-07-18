import crypto from 'crypto';

/**
 * Menghasilkan token acak 32-byte dengan tingkat entropi tinggi.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Menghasilkan hash SHA-256 dari token untuk disimpan dengan aman di database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
