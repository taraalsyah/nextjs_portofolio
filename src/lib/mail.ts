import nodemailer from 'nodemailer';

const host = process.env.SMTP_SERVER;
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USERNAME;
const pass = process.env.SMTP_PASSWORD;

// Buat transporter SMTP
export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // false untuk port 587 (Gmail TLS/STARTTLS)
  auth: {
    user,
    pass,
  },
});

// Jalankan transporter.verify() saat development untuk memastikan koneksi berhasil
if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP Connection Verification Failed:', error);
    } else {
      console.log('SMTP Connection Verified Successfully. Ready to send emails.');
    }
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const from = process.env.SMTP_USERNAME || 'noreply@example.com';

  try {
    const info = await transporter.sendMail({
      from: `"Portofolio taraalsyah" <${from}>`,
      to,
      subject,
      html,
      text,
    });
    
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
