import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Feature', () => {
  test('AUTH-001 — Successful Login', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'testuser@tasktuntas.com';
    const password = process.env.TEST_USER_PASSWORD || 'Password123!';

    // Step 1: Navigate to existing login page
    await page.goto('/login');

    // Verify initial login form elements
    await expect(page.getByRole('heading', { name: 'Selamat Datang' })).toBeVisible();

    // Fill credentials using stable input IDs / labels
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Click Step 1 Submit button
    const submitBtnStep1 = page.getByRole('button', { name: 'Lanjutkan Ke Verifikasi' });
    await expect(submitBtnStep1).toBeEnabled();
    await submitBtnStep1.click();

    // Step 2: Wait for 2FA OTP verification view
    await expect(page.getByText('Enter verification code')).toBeVisible({ timeout: 10000 });

    // Fill the 6 OTP input slots
    const otpSlots = page.locator('input[autoComplete="one-time-code"]');
    await expect(otpSlots).toHaveCount(6);

    const testOtpDigits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      await otpSlots.nth(i).fill(testOtpDigits[i]);
    }

    // Click Step 2 Verify button
    const verifyOtpBtn = page.getByRole('button', { name: 'Verify OTP' });
    await expect(verifyOtpBtn).toBeEnabled();
    await verifyOtpBtn.click();

    // Verify OTP success state feedback is shown
    await expect(page.getByText('Login Berhasil!')).toBeVisible({ timeout: 10000 });

    // Step 3: Verify redirection to dashboard (allowing time for 1.8s UI animation + server navigation)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    // Assert dashboard authenticated indicators
    await expect(page.getByText(/Selamat datang kembali/i)).toBeVisible({ timeout: 15000 });
  });
});
