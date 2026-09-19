import { test, expect } from '@playwright/test';

test.describe('Authentication - Registration Feature', () => {
  test('AUTH-002 — Successful User Registration', async ({ page }) => {
    // Generate unique email per test run for strict isolation
    const uniqueEmail = `test_reg_${Date.now()}@example.com`;
    const password = process.env.TEST_REGISTER_PASSWORD || 'Password123!';
    const name = 'Test User Registration';

    // Step 1: Open Register Page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Buat Akun' })).toBeVisible();

    // Step 2: Fill Registration Form
    await page.locator('#name').fill(name);
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);

    // Submit Registration
    const registerBtn = page.getByRole('button', { name: 'Daftar' });
    await expect(registerBtn).toBeEnabled();
    await registerBtn.click();

    // Verify registration success card feedback
    await expect(page.getByText('Registrasi Berhasil!')).toBeVisible({ timeout: 10000 });

    // Step 3: Verify redirection to Email Verification Page
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Verifikasi Email/i })).toBeVisible();

    // Step 4: Fill valid OTP code and submit verification
    const otpInput = page.locator('#code');
    await expect(otpInput).toBeVisible();
    await otpInput.fill('123456');

    const verifyBtn = page.getByRole('button', { name: 'Verifikasi' });
    await expect(verifyBtn).toBeEnabled();
    await verifyBtn.click();

    // Verify verification success card feedback
    await expect(page.getByText('Verifikasi Berhasil!')).toBeVisible({ timeout: 10000 });

    // Step 5: Verify redirection to Login Page with success banner (allowing 2s UI animation)
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    await expect(page.getByText('Registrasi berhasil. Silakan login.')).toBeVisible({ timeout: 15000 });

    // Step 6: Complete end-to-end Login with the newly registered user
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill(password);

    const loginStep1Btn = page.getByRole('button', { name: 'Lanjutkan Ke Verifikasi' });
    await expect(loginStep1Btn).toBeEnabled();
    await loginStep1Btn.click();

    // Wait for 2FA OTP step
    await expect(page.getByText('Enter verification code')).toBeVisible({ timeout: 10000 });

    const otpSlots = page.locator('input[autoComplete="one-time-code"]');
    await expect(otpSlots).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await otpSlots.nth(i).fill(`${i + 1}`);
    }

    const verifyOtpBtn = page.getByRole('button', { name: 'Verify OTP' });
    await expect(verifyOtpBtn).toBeEnabled();
    await verifyOtpBtn.click();

    await expect(page.getByText('Login Berhasil!')).toBeVisible({ timeout: 10000 });

    // Verify successful access to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  });
});
