import crypto from 'crypto';

export function generateOTP(): string {
  // Generate a cryptographically secure random number between 100000 and 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}
export default generateOTP;
