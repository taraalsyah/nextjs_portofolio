import { sendEmail } from '@/lib/mail';

export interface CommentNotificationPayload {
  postTitle: string;
  postSlug: string;
  commenterName: string;
  commenterEmail: string;
  content: string;
  status: string;
  createdAt?: Date;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendNewCommentNotification(
  payload: CommentNotificationPayload
): Promise<void> {
  const recipient =
    process.env.COMMENT_NOTIFY_EMAIL || 'taraalsyah45@gmail.com';

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    'https://tasktuntas.com';

  const articleUrl = `${baseUrl.replace(/\/$/, '')}/blog/${payload.postSlug}`;

  const dateObj = payload.createdAt || new Date();
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);

  const safeTitle = escapeHtml(payload.postTitle);
  const safeName = escapeHtml(payload.commenterName);
  const safeEmail = escapeHtml(payload.commenterEmail);
  const safeContent = escapeHtml(payload.content).replace(/\n/g, '<br/>');
  const safeStatus = escapeHtml(payload.status);

  const subject = `[Komentar Baru] ${payload.postTitle}`;

  const textBody = `
Komentar baru telah ditambahkan pada artikel:
"${payload.postTitle}"
Link: ${articleUrl}

Pengirim: ${payload.commenterName} (${payload.commenterEmail})
Waktu: ${formattedDate}
Status: ${payload.status}

Isi Komentar:
----------------------------------------
${payload.content}
----------------------------------------

Email ini dikirim secara otomatis oleh TaskTuntas Blog Notification.
Balas langsung ke email ini untuk menghubungi komentator.
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:24px 28px;color:#ffffff;">
              <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background-color:rgba(255,255,255,0.2);padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:8px;">
                Notifikasi Komentar
              </span>
              <h2 style="margin:0;font-size:20px;font-weight:800;line-height:1.3;color:#ffffff;">
                Komentar Baru pada Artikel
              </h2>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
                Ada komentar baru yang baru saja masuk pada artikel blog:
              </p>

              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
                <a href="${articleUrl}" style="color:#1d4ed8;font-size:16px;font-weight:700;text-decoration:none;display:block;">
                  ${safeTitle} &rarr;
                </a>
              </div>

              <!-- Metadata Table -->
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;margin-bottom:20px;border-collapse:collapse;">
                <tr>
                  <td width="130" style="color:#64748b;font-weight:600;padding-left:0;">Nama Pengirim:</td>
                  <td style="color:#0f172a;font-weight:600;">${safeName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-weight:600;padding-left:0;">Email:</td>
                  <td><a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-weight:600;padding-left:0;">Waktu:</td>
                  <td style="color:#0f172a;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-weight:600;padding-left:0;">Status:</td>
                  <td>
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;background-color:#dcfce7;color:#15803d;text-transform:uppercase;">
                      ${safeStatus}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Comment Bubble -->
              <div style="margin-top:8px;">
                <strong style="font-size:14px;color:#0f172a;display:block;margin-bottom:8px;">Isi Komentar:</strong>
                <div style="background-color:#f1f5f9;border-left:4px solid #2563eb;padding:14px 18px;border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:#1e293b;">
                  ${safeContent}
                </div>
              </div>

              <!-- Action Link -->
              <div style="margin-top:24px;text-align:center;">
                <a href="${articleUrl}#komentar" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:6px;">
                  Buka Halaman Artikel
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
              Email ini dikirim otomatis oleh TaskTuntas Blog Engine. Anda dapat langsung membalas email ini untuk menghubungi komentator.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    const result = await sendEmail({
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
      replyTo: payload.commenterEmail,
    });

    if (!result.success) {
      console.warn('[Comment Notification] Failed to send email:', result.message);
    }
  } catch (err: any) {
    // Non-blocking error handling: never fail the comment submission if email fails
    console.error(
      '[Comment Notification Error] Could not dispatch email notification:',
      err?.message || err
    );
  }
}
